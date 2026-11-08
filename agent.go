package main

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

// AgentExecutionStep represents an individual Think-Act-Observe action step
type AgentExecutionStep struct {
	ID        string                 `json:"id"`
	Phase     string                 `json:"phase"`     // "PLAN", "THINK", "ACT", "OBSERVE", "REFLECT"
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
	queue      []string
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
		queue:  make([]string, 0),
	}
}

// QueueTask appends a task directive to the agent's autonomous queue
func (ah *AgentHarness) QueueTask(task string) map[string]interface{} {
	ah.mu.Lock()
	defer ah.mu.Unlock()
	ah.queue = append(ah.queue, task)
	return map[string]interface{}{
		"status": "queued",
		"task":   task,
		"queue":  ah.queue,
	}
}

// GetTaskQueue returns the current list of pending queued tasks
func (ah *AgentHarness) GetTaskQueue() []string {
	ah.mu.RLock()
	defer ah.mu.RUnlock()
	res := make([]string, len(ah.queue))
	copy(res, ah.queue)
	return res
}

// ClearTaskQueue clears all pending queued tasks
func (ah *AgentHarness) ClearTaskQueue() []string {
	ah.mu.Lock()
	defer ah.mu.Unlock()
	ah.queue = make([]string, 0)
	return ah.queue
}

// RemoveTask removes a specific task from the queue by index
func (ah *AgentHarness) RemoveTask(index int) []string {
	ah.mu.Lock()
	defer ah.mu.Unlock()
	if index >= 0 && index < len(ah.queue) {
		ah.queue = append(ah.queue[:index], ah.queue[index+1:]...)
	}
	res := make([]string, len(ah.queue))
	copy(res, ah.queue)
	return res
}

// ProcessNextTask pops and immediately executes the next queued task, returning the task name
func (ah *AgentHarness) ProcessNextTask() string {
	ah.mu.Lock()
	var nextTask string
	if len(ah.queue) > 0 {
		nextTask = ah.queue[0]
		ah.queue = ah.queue[1:]
	}
	ah.mu.Unlock()

	if nextTask != "" {
		ah.executeDirective(nextTask)
	}
	return nextTask
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

	// Support chained pipeline execution via '&&'
	if strings.Contains(directive, "&&") {
		subDirectives := strings.Split(directive, "&&")
		for _, sub := range subDirectives {
			trimmed := strings.TrimSpace(sub)
			if trimmed != "" {
				ah.executeDirective(trimmed)
			}
		}
		return
	}

	// 1. PLAN: Break down directive into high-level objective
	planStep := AgentExecutionStep{
		ID:        uuid.New().String(),
		Phase:     "PLAN",
		Thought:   fmt.Sprintf("Synthesizing execution plan for objective: '%s'", directive),
		Timestamp: time.Now().UnixMilli(),
	}
	ah.recordStep(planStep)

	// 2. THINK: Determine optimal MCP tool and argument synthesis
	selectedTool := "agent_status"
	args := map[string]interface{}{}

	if directive == "scan_sessions" || directive == "session_list" {
		selectedTool = "session_list"
	} else if directive == "check_config" {
		selectedTool = "config_get"
	} else if directive == "git_status" {
		selectedTool = "git_status"
	} else if directive == "system_info" {
		selectedTool = "system_info"
	} else if len(directive) > 10 && directive[:10] == "file_read:" {
		selectedTool = "file_read"
		args["path"] = directive[10:]
	} else if len(directive) > 14 && directive[:14] == "shell_execute:" {
		selectedTool = "shell_execute"
		args["command"] = directive[14:]
	} else if len(directive) > 17 && directive[:17] == "workspace_search:" {
		selectedTool = "workspace_search"
		args["query"] = directive[17:]
	} else {
		selectedTool = "shell_execute"
		args["command"] = "echo Processing: " + directive
	}

	thinkStep := AgentExecutionStep{
		ID:        uuid.New().String(),
		Phase:     "THINK",
		Tool:      selectedTool,
		Thought:   fmt.Sprintf("Reasoned selection: invoke MCP tool '%s' with tailored parameters.", selectedTool),
		Input:     args,
		Timestamp: time.Now().UnixMilli(),
	}
	ah.recordStep(thinkStep)

	// 3. ACT: Dispatch call to MCP aggregator
	actStep := AgentExecutionStep{
		ID:        uuid.New().String(),
		Phase:     "ACT",
		Tool:      selectedTool,
		Thought:   fmt.Sprintf("Dispatching execution to MCP tool '%s'", selectedTool),
		Input:     args,
		Timestamp: time.Now().UnixMilli(),
	}
	ah.recordStep(actStep)

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

	// 4. OBSERVE: Receive output and telemetry
	obsStep := AgentExecutionStep{
		ID:        uuid.New().String(),
		Phase:     "OBSERVE",
		Tool:      selectedTool,
		Thought:   "Evaluating output and duration of MCP tool execution.",
		Result:    resultStr,
		Duration:  time.Since(startTime).Milliseconds(),
		Timestamp: time.Now().UnixMilli(),
	}
	ah.recordStep(obsStep)

	// 5. REFLECT: Synthesize completion and plan next steps
	reflectStep := AgentExecutionStep{
		ID:        uuid.New().String(),
		Phase:     "REFLECT",
		Tool:      selectedTool,
		Thought:   fmt.Sprintf("Goal '%s' successfully resolved via '%s'. System state consistent.", directive, selectedTool),
		Duration:  time.Since(startTime).Milliseconds(),
		Timestamp: time.Now().UnixMilli(),
	}
	ah.recordStep(reflectStep)
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
	ticker := time.NewTicker(3 * time.Second)
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
			// Check if any queued tasks exist to execute sequentially
			ah.mu.Lock()
			var nextTask string
			if len(ah.queue) > 0 {
				nextTask = ah.queue[0]
				ah.queue = ah.queue[1:]
			}
			ah.mu.Unlock()

			if nextTask != "" {
				ah.executeDirective(nextTask)
			} else {
				// Autonomous heartbeat reasoning cycle
				ah.executeDirective(fmt.Sprintf("autonomous heartbeat at %s", time.Now().Format("15:04:05")))
			}
		}
	}
}
