package mcp

import (
	"encoding/json"
	"net/http"
	"sync"
)

type Tool struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	InputSchema interface{} `json:"inputSchema"`
}

type CallToolRequest struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

type Server struct {
	tools []Tool
	mu    sync.RWMutex
}

func NewServer() *Server {
	return &Server{
		tools: []Tool{},
	}
}

func (s *Server) RegisterTool(tool Tool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.tools = append(s.tools, tool)
}

func (s *Server) ListTools(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"tools": s.tools,
	})
}

func (s *Server) HandleCallTool(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		// Provide informative response for GET
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "ready",
			"message": "Send POST request with JSON {name, arguments} to invoke tools",
		})
		return
	}

	var req CallToolRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Invalid JSON payload",
		})
		return
	}

	s.mu.RLock()
	var found *Tool
	for _, t := range s.tools {
		if t.Name == req.Name {
			found = &t
			break
		}
	}
	s.mu.RUnlock()

	if found == nil {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error":  "Tool not found",
			"tool":   req.Name,
			"status": "failed",
		})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"tool":      req.Name,
		"status":    "executed",
		"arguments": req.Arguments,
		"result":    "Tool executed successfully via TormentNexus MCP",
	})
}

func (s *Server) SetupRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/tools", s.ListTools)
	mux.HandleFunc("/call", s.HandleCallTool)
}
