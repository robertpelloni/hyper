package mcp

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
)

type Tool struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	InputSchema interface{} `json:"inputSchema"`
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
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tools": s.tools,
	})
}

func (s *Server) HandleCallTool(w http.ResponseWriter, r *http.Request) {
	// Implementation for calling tools
	fmt.Fprintf(w, "Tool call handling not yet fully implemented")
}

func (s *Server) SetupRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/tools", s.ListTools)
	mux.HandleFunc("/call", s.HandleCallTool)
}
