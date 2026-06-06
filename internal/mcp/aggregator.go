package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
)

type ServerInfo struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type Aggregator struct {
	servers map[string]string
	tools   map[string]ToolDef
	mu      sync.RWMutex
}

type ToolDef struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Schema      json.RawMessage `json:"inputSchema"`
}

func NewAggregator() *Aggregator {
	return &Aggregator{
		servers: make(map[string]string),
		tools:   make(map[string]ToolDef),
	}
}

func (a *Aggregator) RegisterServer(name, url string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.servers[name] = url
	// Claude Desktop parity: auto-discover tools from registered MCP server
	go a.discoverTools(name, url)
}

func (a *Aggregator) discoverTools(name, url string) {
	// Mock tool discovery
	a.mu.Lock()
	defer a.mu.Unlock()
	a.tools[name+":ls"] = ToolDef{
		Name:        name + ":ls",
		Description: "List files (MCP)",
		Schema:      json.RawMessage(`{"type":"object"}`),
	}
}

func (a *Aggregator) ListServers() []ServerInfo {
	a.mu.RLock()
	defer a.mu.RUnlock()
	var list []ServerInfo
	for k, v := range a.servers {
		list = append(list, ServerInfo{Name: k, URL: v})
	}
	return list
}

func (a *Aggregator) GetTools() []ToolDef {
	a.mu.RLock()
	defer a.mu.RUnlock()
	var list []ToolDef
	for _, v := range a.tools {
		list = append(list, v)
	}
	return list
}

func (a *Aggregator) ProxyRequest(ctx context.Context, serverName string, payload string) (string, error) {
	a.mu.RLock()
	url, ok := a.servers[serverName]
	a.mu.RUnlock()
	if !ok {
		return "", fmt.Errorf("server %s not found", serverName)
	}
	// Real MCP transport would use JSON-RPC over HTTP/SSE or Stdio here
	return fmt.Sprintf("Proxied to %s (%s): %s", serverName, url, payload), nil
}

func (a *Aggregator) HandleMCPListTools(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(a.GetTools())
}
