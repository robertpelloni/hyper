package main

import (
	"context"
	"fmt"
	"os/exec"
	"sync"
	"time"

	"tormentnexus/internal/intelligence"
)

// AgentHarness implements the autonomous agent execution loop
type AgentHarness struct {
	messages []string
	status   string
	mu       sync.RWMutex
	running  bool
	cancel   context.CancelFunc
	indexer  intelligence.Indexer
	mcp      *MCPAggregator
}

func NewAgentHarness(mcp *MCPAggregator) *AgentHarness {
	return &AgentHarness{
		status:  "idle",
		indexer: intelligence.NewBasicIndexer("."),
		mcp:     mcp,
	}
}

// SearchCodex performs a semantic search against the Codex indexer
func (ah *AgentHarness) SearchCodex(query string) ([]string, error) {
	return ah.indexer.Search(query)
}

// GetCommandContext retrieves contextual insights for a command
func (ah *AgentHarness) GetCommandContext(command string) string {
	return ah.indexer.GetContextForCommand(command)
}

// ExecuteClaudeCode executes a prompt using the claude CLI
func (ah *AgentHarness) ExecuteClaudeCode(prompt string, directory string) (string, error) {
	cmd := exec.Command("claude", prompt)
	if directory != "" {
		cmd.Dir = directory
	}
	out, err := cmd.CombinedOutput()
	return string(out), err
}

// GitStatus executes git status
func (ah *AgentHarness) GitStatus(directory string) (string, error) {
	cmd := exec.Command("git", "status")
	if directory != "" {
		cmd.Dir = directory
	}
	out, err := cmd.CombinedOutput()
	return string(out), err
}

// GitCommit executes git commit -m
func (ah *AgentHarness) GitCommit(message string, directory string) (string, error) {
	cmd := exec.Command("git", "commit", "-m", message)
	if directory != "" {
		cmd.Dir = directory
	}
	out, err := cmd.CombinedOutput()
	return string(out), err
}

// ExecuteGeminiCLI executes a prompt using the gemini CLI
func (ah *AgentHarness) ExecuteGeminiCLI(prompt string) (string, error) {
	cmd := exec.Command("gemini", prompt)
	out, err := cmd.CombinedOutput()
	return string(out), err
}

// ExecuteCommand processes an agent command and returns the result
func (ah *AgentHarness) ExecuteCommand(command string) map[string]interface{} {
	ah.mu.Lock()
	defer ah.mu.Unlock()

	ah.messages = append(ah.messages, command)

	switch command {
	case "status":
		return map[string]interface{}{
			"status":    ah.status,
			"messages":  len(ah.messages),
			"running":   ah.running,
			"timestamp": time.Now().UnixMilli(),
		}
	case "start":
		if !ah.running {
			ah.status = "running"
			ah.running = true
			ctx, cancel := context.WithCancel(context.Background())
			ah.cancel = cancel
			go ah.runLoop(ctx)
			return map[string]interface{}{
				"response": "Agent harness started",
				"status":   "running",
			}
		}
		return map[string]interface{}{
			"response": "Agent harness already running",
			"status":   ah.status,
		}
	case "stop":
		if ah.running && ah.cancel != nil {
			ah.cancel()
			ah.running = false
			ah.status = "stopped"
			return map[string]interface{}{
				"response": "Agent harness stopped",
				"status":   "stopped",
			}
		}
		return map[string]interface{}{
			"response": "Agent harness not running",
			"status":   ah.status,
		}
	default:
		ah.messages = append(ah.messages, fmt.Sprintf("executed: %s", command))
		return map[string]interface{}{
			"response": fmt.Sprintf("Command '%s' processed", command),
			"status":   ah.status,
		}
	}
}

// GetStatus returns the current agent status
func (ah *AgentHarness) GetStatus() map[string]interface{} {
	ah.mu.RLock()
	defer ah.mu.RUnlock()

	return map[string]interface{}{
		"status":   ah.status,
		"running":  ah.running,
		"messages": len(ah.messages),
	}
}

// HealthCheck returns agent health info
func (ah *AgentHarness) HealthCheck() map[string]interface{} {
	ah.mu.RLock()
	defer ah.mu.RUnlock()

	return map[string]interface{}{
		"status":    "active",
		"running":   ah.running,
		"uptime":    time.Now().UnixMilli(),
		"messages":  len(ah.messages),
		"version":   "1.0.0",
	}
}

// runLoop is the autonomous execution loop
func (ah *AgentHarness) runLoop(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
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
			// Agent Think -> Act -> Observe cycle
			ah.mu.Lock()

			// 1. Think
			ah.messages = append(ah.messages, fmt.Sprintf("agent tick at %v: Thinking...", time.Now().Format(time.RFC3339)))

			// 2. Act (Tool Use via MCP)
			if ah.mcp != nil {
				tools := ah.mcp.ListTools()
				if len(tools) > 0 {
					// Simulate calling a tool autonomously
					targetTool := tools[0]
					result := ah.mcp.CallTool(targetTool.Name, map[string]interface{}{})
					ah.messages = append(ah.messages, fmt.Sprintf("Act: executed tool '%s' -> %v", targetTool.Name, result["status"]))
				}
			}

			// 3. Observe
			ah.messages = append(ah.messages, "Observe: processed tool feedback.")

			ah.mu.Unlock()
		}
	}
}
