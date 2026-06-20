package goose

// Re-implementation of Goose's Model Context Protocol (MCP) Registry

import (
	"errors"
	"fmt"
)

type MCPTool struct {
	Name        string
	Description string
	InputSchema string
	Execute     func(input string) (string, error)
}

type MCPRegistry struct {
	tools map[string]MCPTool
}

func NewMCPRegistry() *MCPRegistry {
	return &MCPRegistry{
		tools: make(map[string]MCPTool),
	}
}

func (r *MCPRegistry) RegisterTool(tool MCPTool) {
	r.tools[tool.Name] = tool
}

func (r *MCPRegistry) GetTool(name string) (MCPTool, bool) {
	tool, exists := r.tools[name]
	return tool, exists
}

func (r *MCPRegistry) ExecuteTool(name string, input string) (string, error) {
	tool, exists := r.tools[name]
	if !exists {
		return "", errors.New(fmt.Sprintf("Tool %s not found in MCP registry.", name))
	}
	return tool.Execute(input)
}
