package main

import (
	"encoding/json"
	"fmt"
	"sync"
)

// MCPTool represents a Model Context Protocol tool
type MCPTool struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	InputSchema map[string]interface{} `json:"inputSchema"`
}

// MCPAggregator manages MCP tools and server aggregation
type MCPAggregator struct {
	tools       []MCPTool
	servers     []map[string]interface{}
	mu          sync.RWMutex
}

func NewMCPAggregator() *MCPAggregator {
	ag := &MCPAggregator{
		tools:   make([]MCPTool, 0),
		servers: make([]map[string]interface{}, 0),
	}

	// Register built-in tools
	ag.RegisterTool(MCPTool{
		Name:        "shell_execute",
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
		Description: "Check the status of the autonomous agent harness",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	})

	ag.RegisterTool(MCPTool{
		Name:        "session_list",
		Description: "List all active PTY sessions",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	})

	ag.RegisterTool(MCPTool{
		Name:        "config_get",
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

// CallTool invokes a tool by name
func (ag *MCPAggregator) CallTool(name string, args map[string]interface{}) map[string]interface{} {
	ag.mu.RLock()
	defer ag.mu.RUnlock()

	for _, tool := range ag.tools {
		if tool.Name == name {
			return map[string]interface{}{
				"tool":   name,
				"status": "executed",
				"args":   args,
			}
		}
	}

	return map[string]interface{}{
		"tool":   name,
		"status": "not_found",
		"error":  fmt.Sprintf("Tool '%s' not registered", name),
	}
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
	}
}
