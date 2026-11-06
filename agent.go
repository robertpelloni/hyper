package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// AgentExecutionStep represents an individual Think-Act-Observe action step
type AgentExecutionStep struct {
	ID        string                 `json:"id"`
	Phase     string                 `json:"phase"`     // "THINK", "ACT", "OBSERVE"
	Tool      string                 `json:"tool,omitempty"`
	Thought   string                 `json:"thought"`
	Input     map[string]interface{} `json:"input,omitempty"`
	Result    string                 `json:"result,omitempty"`
	Duration  int64                  `json:"durationMs"`
	Timestamp int64                  `json:"timestamp"`
}

// AgentHarness implements the autonomous agent execution loop with MCP tool use
type AgentHarness struct {
	messages   []string
	steps      []AgentExecutionStep
	status     string
	iterations int64
	mu         sync.RWMutex
	running    bool
	cancel     context.CancelFunc
	mcp        *MCPAggregator
	runtime    *App
}

func NewAgentHarness() *AgentHarness {
	return &AgentHarness{
		status: "idle",
		steps:  make([]AgentExecutionStep, 0),
	}
}

func (ah *AgentHarness) SetMCPAggregator(mcp *MCPAggregator) {
	ah.mu.Lock()
	defer ah.mu.Unlock()
	ah.mcp = mcp
}

func (ah *AgentHarness) SetRuntime(runtime *App) {
	ah.mu.Lock()
	defer ah.mu.Unlock()
	ah.runtime = runtime
}

// ExecuteCommand processes an agent command and returns the result
func (ah *AgentHarness) ExecuteCommand(command string) map[string]interface{} {
	ah.mu.Lock()
	ah.messages = append(ah.messages, command)
	ah.mu.Unlock()

	switch command {
	case "status":
		ah.mu.RLock()
		defer ah.mu.RUnlock()
		return map[string]interface{}{
			"status":     ah.status,
			"messages":   len(ah.messages),
			"steps":      len(ah.steps),
			"running":    ah.running,
			"iterations": ah.iterations,
			"timestamp":  time.Now().UnixMilli(),
		}
	case "start":
		ah.mu.Lock()
		if !ah.running {
			ah.status = "running"
			ah.running = true
			ctx, cancel := context.WithCancel(context.Background())
			ah.cancel = cancel
			ah.mu.Unlock()
			go ah.runLoop(ctx)
			return map[string]interface{}{
				"response": "Autonomous Agent loop started",
				"status":   "running",
			}
		}
		ah.mu.Unlock()
		return map[string]interface{}{
			"response": "Autonomous Agent already running",
			"status":   ah.status,
		}
	case "stop":
		ah.mu.Lock()
		if ah.running && ah.cancel != nil {
			ah.cancel()
			ah.running = false
			ah.status = "stopped"
			ah.mu.Unlock()
			return map[string]interface{}{
				"response": "Autonomous Agent stopped",
				"status":   "stopped",
			}
		}
		ah.mu.Unlock()
		return map[string]interface{}{
			"response": "Autonomous Agent not running",
			"status":   ah.status,
		}
	default:
		// Execute manual directive as an autonomous cycle
		go ah.executeDirective(command)
		return map[string]interface{}{
			"response": fmt.Sprintf("Autonomous directive '%s' dispatched to MCP harness", command),
			"status":   ah.status,
		}
	}
}

func (ah *AgentHarness) executeDirective(directive string) {
	startTime := time.Now()
	ah.mu.Lock()
	ah.iterations++
	ah.mu.Unlock()

	// 1. THINK
	thinkStep := AgentExecutionStep{
		ID:        uuid.New().String(),
		Phase:     "THINK",
		Thought:   fmt.Sprintf("Analyzing directive: '%s'. Determining required MCP tool call.", directive),
		Timestamp: time.Now().UnixMilli(),
	}
	ah.recordStep(thinkStep)

	// 2. ACT
	selectedTool := "agent_status"
	args := map[string]interface{}{}
	if directive == "scan_sessions" || directive == "session_list" {
		selectedTool = "session_list"
	} else if directive == "check_config" {
		selectedTool = "config_get"
	} else {
		selectedTool = "shell_execute"
		args["command"] = "echo Processing: " + directive
	}

	actStep := AgentExecutionStep{
		ID:        uuid.New().String(),
		Phase:     "ACT",
		Tool:      selectedTool,
		Thought:   fmt.Sprintf("Dispatching execution to MCP tool '%s'", selectedTool),
		Input:     args,
		Timestamp: time.Now().UnixMilli(),
	}
	ah.recordStep(actStep)

	// Execute via MCP aggregator if connected
	var resultStr string
	ah.mu.RLock()
	mcpRef := ah.mcp
	ah.mu.RUnlock()

	if mcpRef != nil {
		res := mcpRef.CallTool(selectedTool, args)
		resultStr = fmt.Sprintf("%+v", res)
	} else {
		resultStr = fmt.Sprintf("Tool %s executed (simulated)", selectedTool)
	}

	// 3. OBSERVE
	obsStep := AgentExecutionStep{
		ID:        uuid.New().String(),
		Phase:     "OBSERVE",
		Tool:      selectedTool,
		Thought:   "Evaluating output of MCP tool invocation.",
		Result:    resultStr,
		Duration:  time.Since(startTime).Milliseconds(),
		Timestamp: time.Now().UnixMilli(),
	}
	ah.recordStep(obsStep)
}

func (ah *AgentHarness) recordStep(step AgentExecutionStep) {
	ah.mu.Lock()
	ah.steps = append(ah.steps, step)
	if len(ah.steps) > 50 {
		ah.steps = ah.steps[len(ah.steps)-50:]
	}
	runtimeRef := ah.runtime
	ah.mu.Unlock()

	if runtimeRef != nil {
		runtimeRef.EmitEvent("agent:step", step)
	}
}

// GetExecutionSteps returns all recorded Think-Act-Observe steps
func (ah *AgentHarness) GetExecutionSteps() []AgentExecutionStep {
	ah.mu.RLock()
	defer ah.mu.RUnlock()
	res := make([]AgentExecutionStep, len(ah.steps))
	copy(res, ah.steps)
	return res
}

// GetStatus returns the current agent status
func (ah *AgentHarness) GetStatus() map[string]interface{} {
	ah.mu.RLock()
	defer ah.mu.RUnlock()

	return map[string]interface{}{
		"status":     ah.status,
		"running":    ah.running,
		"messages":   len(ah.messages),
		"steps":      len(ah.steps),
		"iterations": ah.iterations,
	}
}

// HealthCheck returns agent health info
func (ah *AgentHarness) HealthCheck() map[string]interface{} {
	ah.mu.RLock()
	defer ah.mu.RUnlock()

	return map[string]interface{}{
		"status":     "active",
		"running":    ah.running,
		"uptime":     time.Now().UnixMilli(),
		"messages":   len(ah.messages),
		"steps":      len(ah.steps),
		"iterations": ah.iterations,
		"version":    "1.1.0",
	}
}

// runLoop is the autonomous execution loop
func (ah *AgentHarness) runLoop(ctx context.Context) {
	ticker := time.NewTicker(4 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			ah.mu.Lock()
			ah.running = false
			ah.status = "stopped"
			ah.mu.Unlock()
			return
		case <-ticker.C:
			// Autonomous Think -> Act -> Observe cycle
			ah.executeDirective(fmt.Sprintf("autonomous heartbeat at %s", time.Now().Format("15:04:05")))
		}
	}
}
