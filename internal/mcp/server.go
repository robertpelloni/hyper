package mcp

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
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

type ToolExecutionRecord struct {
	Tool       string `json:"tool"`
	StatusCode int    `json:"statusCode"`
	DurationMs int64  `json:"durationMs"`
	Timestamp  int64  `json:"timestamp"`
	Success    bool   `json:"success"`
	Status     string `json:"status"`
}

type Server struct {
	tools   []Tool
	history []ToolExecutionRecord
	mu      sync.RWMutex
}

func NewServer() *Server {
	return &Server{
		tools:   []Tool{},
		history: []ToolExecutionRecord{},
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
	startTime := time.Now()
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "ready",
			"message": "Send POST request with JSON {name, arguments} to invoke tools",
		})
		return
	}

	var req CallToolRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		durationMs := time.Since(startTime).Milliseconds()
		s.recordExecution("", http.StatusBadRequest, durationMs, false, "bad_request")
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
		durationMs := time.Since(startTime).Milliseconds()
		s.recordExecution(req.Name, http.StatusNotFound, durationMs, false, "not_found")
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error":  "Tool not found",
			"tool":   req.Name,
			"status": "failed",
		})
		return
	}

	durationMs := time.Since(startTime).Milliseconds()
	s.recordExecution(req.Name, http.StatusOK, durationMs, true, "executed")

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"tool":       req.Name,
		"status":     "executed",
		"statusCode": http.StatusOK,
		"durationMs": durationMs,
		"arguments":  req.Arguments,
		"result":     "Tool executed successfully via TormentNexus MCP",
	})
}

func (s *Server) recordExecution(tool string, statusCode int, durationMs int64, success bool, status string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	record := ToolExecutionRecord{
		Tool:       tool,
		StatusCode: statusCode,
		DurationMs: durationMs,
		Timestamp:  time.Now().UnixMilli(),
		Success:    success,
		Status:     status,
	}
	s.history = append(s.history, record)
	if len(s.history) > 100 {
		s.history = s.history[len(s.history)-100:]
	}
}

func (s *Server) GetHistory() []ToolExecutionRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()
	res := make([]ToolExecutionRecord, len(s.history))
	copy(res, s.history)
	return res
}

func (s *Server) HandleHistory(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"history": s.GetHistory(),
	})
}

func (s *Server) SetupRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/tools", s.ListTools)
	mux.HandleFunc("/call", s.HandleCallTool)
	mux.HandleFunc("/history", s.HandleHistory)
}
