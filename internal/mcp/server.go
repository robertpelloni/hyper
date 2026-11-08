package mcp

import (
	"encoding/json"
	"errors"
	"net/http"
	"sync"
	"time"
)

type Tool struct {
	Name        string      `json:"name"`
	Category    string      `json:"category,omitempty"`
	Description string      `json:"description"`
	InputSchema interface{} `json:"inputSchema"`
	Required    []string    `json:"required,omitempty"`
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

	// Protect against oversized payloads (limit to 1MB)
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)

	var req CallToolRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		durationMs := time.Since(startTime).Milliseconds()
		statusCode := http.StatusBadRequest
		errorCode := "INVALID_ARGUMENTS"
		errMsg := "Invalid JSON payload"

		// Check if payload exceeded 1MB limit (*http.MaxBytesError)
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) || err.Error() == "http: request body too large" {
			statusCode = http.StatusRequestEntityTooLarge
			errorCode = "PAYLOAD_TOO_LARGE"
			errMsg = "Request payload exceeds 1MB limit"
		} else {
			// Also inspect underlying error message if wrapped
			if errors.Is(err, &http.MaxBytesError{}) || (err != nil && (len(err.Error()) >= 28 && err.Error()[:28] == "http: request body too large")) {
				statusCode = http.StatusRequestEntityTooLarge
				errorCode = "PAYLOAD_TOO_LARGE"
				errMsg = "Request payload exceeds 1MB limit"
			}
		}

		s.recordExecution("", statusCode, durationMs, false, errorCode)
		w.WriteHeader(statusCode)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error":      errMsg,
			"errorCode":  errorCode,
			"statusCode": statusCode,
			"status":     "failed",
		})
		return
	}

	if req.Name == "" {
		durationMs := time.Since(startTime).Milliseconds()
		s.recordExecution("", http.StatusBadRequest, durationMs, false, "EMPTY_TOOL_NAME")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error":      "Tool name cannot be empty",
			"errorCode":  "EMPTY_TOOL_NAME",
			"statusCode": http.StatusBadRequest,
			"status":     "failed",
		})
		return
	}

	s.mu.RLock()
	var found *Tool
	for _, t := range s.tools {
		if t.Name == req.Name {
			tCopy := t
			found = &tCopy
			break
		}
	}
	s.mu.RUnlock()

	if found == nil {
		durationMs := time.Since(startTime).Milliseconds()
		s.recordExecution(req.Name, http.StatusNotFound, durationMs, false, "TOOL_NOT_FOUND")
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error":      "Tool not found",
			"errorCode":  "TOOL_NOT_FOUND",
			"tool":       req.Name,
			"statusCode": http.StatusNotFound,
			"status":     "failed",
		})
		return
	}

	// Validate required arguments if defined
	if len(found.Required) > 0 {
		for _, reqArg := range found.Required {
			val, exists := req.Arguments[reqArg]
			if !exists || val == nil || val == "" {
				durationMs := time.Since(startTime).Milliseconds()
				s.recordExecution(req.Name, http.StatusBadRequest, durationMs, false, "MISSING_REQUIRED_ARG")
				w.WriteHeader(http.StatusBadRequest)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"error":       "Missing required argument: '" + reqArg + "'",
					"errorCode":   "MISSING_REQUIRED_ARG",
					"missingArg":  reqArg,
					"tool":        req.Name,
					"required":    found.Required,
					"statusCode":  http.StatusBadRequest,
					"status":      "failed",
					"remediation": "Provide '" + reqArg + "' in the arguments JSON object and retry",
				})
				return
			}
		}
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
