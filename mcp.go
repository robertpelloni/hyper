package main

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// MCPTool represents a Model Context Protocol tool
type MCPTool struct {
	Name        string                 `json:"name"`
	Category    string                 `json:"category,omitempty"`
	Description string                 `json:"description"`
	InputSchema map[string]interface{} `json:"inputSchema"`
}

// ToolExecutionRecord stores runtime metrics for executed tools
type ToolExecutionRecord struct {
	Tool       string `json:"tool"`
	StatusCode int    `json:"statusCode"`
	DurationMs int64  `json:"durationMs"`
	Timestamp  int64  `json:"timestamp"`
	Success    bool   `json:"success"`
	Status     string `json:"status"`
}

// MCPAggregator manages MCP tools and server aggregation
type MCPAggregator struct {
	tools   []MCPTool
	servers []map[string]interface{}
	history []ToolExecutionRecord
	mu      sync.RWMutex
}

func NewMCPAggregator() *MCPAggregator {
	ag := &MCPAggregator{
		tools:   make([]MCPTool, 0),
		servers: make([]map[string]interface{}, 0),
		history: make([]ToolExecutionRecord, 0),
	}

	// Register built-in tools
	ag.RegisterTool(MCPTool{
		Name:        "shell_execute",
		Category:    "System",
		Description: "Execute a shell command and return the output",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"command": map[string]interface{}{
					"type":        "string",
					"description": "The command to execute",
				},
			},
			"required": []string{"command"},
		},
	})

	ag.RegisterTool(MCPTool{
		Name:        "file_read",
		Category:    "Filesystem",
		Description: "Read the contents of a file",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"path": map[string]interface{}{
					"type":        "string",
					"description": "The file path to read",
				},
			},
			"required": []string{"path"},
		},
	})

	ag.RegisterTool(MCPTool{
		Name:        "file_write",
		Category:    "Filesystem",
		Description: "Write content to a file",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"path": map[string]interface{}{
					"type":        "string",
					"description": "The file path to write",
				},
				"content": map[string]interface{}{
					"type":        "string",
					"description": "The content to write",
				},
			},
			"required": []string{"path", "content"},
		},
	})

	ag.RegisterTool(MCPTool{
		Name:        "agent_status",
		Category:    "Agent",
		Description: "Check the status of the autonomous agent harness",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	})

	ag.RegisterTool(MCPTool{
		Name:        "session_list",
		Category:    "System",
		Description: "List all active PTY sessions",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	})

	ag.RegisterTool(MCPTool{
		Name:        "config_get",
		Category:    "System",
		Description: "Get the current application configuration",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"key": map[string]interface{}{
					"type":        "string",
					"description": "Optional specific config key to retrieve",
				},
			},
		},
	})

	ag.RegisterTool(MCPTool{
		Name:        "workspace_search",
		Category:    "Intelligence",
		Description: "Search workspace file paths and file contents in-memory",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"query": map[string]interface{}{
					"type":        "string",
					"description": "The search keyword or pattern",
				},
			},
			"required": []string{"query"},
		},
	})

	ag.RegisterTool(MCPTool{
		Name:        "git_status",
		Category:    "System",
		Description: "Get current Git working branch and modified file status",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	})

	ag.RegisterTool(MCPTool{
		Name:        "system_info",
		Category:    "System",
		Description: "Query host platform architecture, CPU count, and runtime stats",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	})

	return ag
}

// RegisterTool adds a new MCP tool
func (ag *MCPAggregator) RegisterTool(tool MCPTool) {
	ag.mu.Lock()
	defer ag.mu.Unlock()
	ag.tools = append(ag.tools, tool)
}

// ListTools returns all registered tools
func (ag *MCPAggregator) ListTools() []MCPTool {
	ag.mu.RLock()
	defer ag.mu.RUnlock()

	result := make([]MCPTool, len(ag.tools))
	copy(result, ag.tools)
	return result
}

// ListToolsJSON returns tools as JSON string for frontend
func (ag *MCPAggregator) ListToolsJSON() string {
	ag.mu.RLock()
	defer ag.mu.RUnlock()

	data, err := json.Marshal(map[string]interface{}{
		"tools": ag.tools,
	})
	if err != nil {
		return fmt.Sprintf(`{"error": "%s"}`, err.Error())
	}
	return string(data)
}

// CallTool invokes a tool by name with response timing tracking
func (ag *MCPAggregator) CallTool(name string, args map[string]interface{}) map[string]interface{} {
	startTime := time.Now()
	ag.mu.RLock()
	var found bool
	for _, tool := range ag.tools {
		if tool.Name == name {
			found = true
			break
		}
	}
	ag.mu.RUnlock()

	durationMs := time.Since(startTime).Milliseconds()

	if !found {
		record := ToolExecutionRecord{
			Tool:       name,
			StatusCode: 404,
			DurationMs: durationMs,
			Timestamp:  time.Now().UnixMilli(),
			Success:    false,
			Status:     "not_found",
		}
		ag.recordHistory(record)

		return map[string]interface{}{
			"tool":       name,
			"status":     "not_found",
			"statusCode": 404,
			"durationMs": durationMs,
			"error":      fmt.Sprintf("Tool '%s' not registered", name),
		}
	}

	record := ToolExecutionRecord{
		Tool:       name,
		StatusCode: 200,
		DurationMs: durationMs,
		Timestamp:  time.Now().UnixMilli(),
		Success:    true,
		Status:     "executed",
	}
	ag.recordHistory(record)

	return map[string]interface{}{
		"tool":       name,
		"status":     "executed",
		"statusCode": 200,
		"durationMs": durationMs,
		"args":       args,
	}
}

func (ag *MCPAggregator) recordHistory(record ToolExecutionRecord) {
	ag.mu.Lock()
	defer ag.mu.Unlock()
	ag.history = append(ag.history, record)
	if len(ag.history) > 100 {
		ag.history = ag.history[len(ag.history)-100:]
	}
}

// GetToolExecutionHistory returns historical executions with latency and status code
func (ag *MCPAggregator) GetToolExecutionHistory() []ToolExecutionRecord {
	ag.mu.RLock()
	defer ag.mu.RUnlock()

	result := make([]ToolExecutionRecord, len(ag.history))
	copy(result, ag.history)
	return result
}

// ClearHistory resets tool execution history
func (ag *MCPAggregator) ClearHistory() {
	ag.mu.Lock()
	defer ag.mu.Unlock()
	ag.history = make([]ToolExecutionRecord, 0)
}

// ListServers returns aggregated MCP servers info
func (ag *MCPAggregator) ListServers() []map[string]interface{} {
	ag.mu.RLock()
	defer ag.mu.RUnlock()

	result := make([]map[string]interface{}, len(ag.servers))
	copy(result, ag.servers)
	return result
}

// AddServer adds an external MCP server
func (ag *MCPAggregator) AddServer(server map[string]interface{}) {
	ag.mu.Lock()
	defer ag.mu.Unlock()
	ag.servers = append(ag.servers, server)
}

// GetTelemetry returns MCP telemetry data
func (ag *MCPAggregator) GetTelemetry() map[string]interface{} {
	ag.mu.RLock()
	defer ag.mu.RUnlock()

	return map[string]interface{}{
		"status":       "active",
		"active_tools": len(ag.tools),
		"servers":      len(ag.servers),
		"version":      "1.0.0",
		"history_size": len(ag.history),
	}
}
