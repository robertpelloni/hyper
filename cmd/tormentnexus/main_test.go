package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestStandaloneServerToolDiscovery(t *testing.T) {
	server := SetupStandaloneServer()
	mux := http.NewServeMux()
	server.SetupRoutes(mux)

	req := httptest.NewRequest(http.MethodGet, "/tools", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var resp struct {
		Tools []struct {
			Name        string   `json:"name"`
			Category    string   `json:"category"`
			Description string   `json:"description"`
			Required    []string `json:"required"`
		} `json:"tools"`
	}

	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode tools response: %v", err)
	}

	if len(resp.Tools) != 8 {
		t.Errorf("expected 8 registered tools, got %d", len(resp.Tools))
	}

	expectedTools := map[string]string{
		"shell_execute":    "System",
		"file_read":        "Filesystem",
		"file_write":       "Filesystem",
		"agent_status":     "Agent",
		"session_list":     "System",
		"workspace_search": "Intelligence",
		"git_status":       "System",
		"system_info":      "System",
	}

	for _, tool := range resp.Tools {
		expectedCategory, ok := expectedTools[tool.Name]
		if !ok {
			t.Errorf("unexpected tool registered: %s", tool.Name)
			continue
		}
		if tool.Category != expectedCategory {
			t.Errorf("tool %s category mismatch: expected %s, got %s", tool.Name, expectedCategory, tool.Category)
		}
	}
}

func TestStandaloneServerToolExecution(t *testing.T) {
	server := SetupStandaloneServer()
	mux := http.NewServeMux()
	server.SetupRoutes(mux)

	tests := []struct {
		name               string
		toolName           string
		arguments          map[string]interface{}
		expectedStatusCode int
		expectedErrorCode  string
	}{
		{
			name:               "shell_execute with command",
			toolName:           "shell_execute",
			arguments:          map[string]interface{}{"command": "whoami"},
			expectedStatusCode: http.StatusOK,
		},
		{
			name:               "shell_execute missing command argument",
			toolName:           "shell_execute",
			arguments:          map[string]interface{}{},
			expectedStatusCode: http.StatusBadRequest,
			expectedErrorCode:  "MISSING_REQUIRED_ARG",
		},
		{
			name:               "file_read with path",
			toolName:           "file_read",
			arguments:          map[string]interface{}{"path": "VERSION.md"},
			expectedStatusCode: http.StatusOK,
		},
		{
			name:               "file_read missing path",
			toolName:           "file_read",
			arguments:          map[string]interface{}{},
			expectedStatusCode: http.StatusBadRequest,
			expectedErrorCode:  "MISSING_REQUIRED_ARG",
		},
		{
			name:               "file_write with path and content",
			toolName:           "file_write",
			arguments:          map[string]interface{}{"path": "/tmp/test.txt", "content": "hello"},
			expectedStatusCode: http.StatusOK,
		},
		{
			name:               "file_write missing content",
			toolName:           "file_write",
			arguments:          map[string]interface{}{"path": "/tmp/test.txt"},
			expectedStatusCode: http.StatusBadRequest,
			expectedErrorCode:  "MISSING_REQUIRED_ARG",
		},
		{
			name:               "agent_status execution without required args",
			toolName:           "agent_status",
			arguments:          map[string]interface{}{},
			expectedStatusCode: http.StatusOK,
		},
		{
			name:               "session_list execution",
			toolName:           "session_list",
			arguments:          map[string]interface{}{},
			expectedStatusCode: http.StatusOK,
		},
		{
			name:               "workspace_search with query",
			toolName:           "workspace_search",
			arguments:          map[string]interface{}{"query": "TormentNexus"},
			expectedStatusCode: http.StatusOK,
		},
		{
			name:               "workspace_search missing query",
			toolName:           "workspace_search",
			arguments:          map[string]interface{}{},
			expectedStatusCode: http.StatusBadRequest,
			expectedErrorCode:  "MISSING_REQUIRED_ARG",
		},
		{
			name:               "git_status execution",
			toolName:           "git_status",
			arguments:          map[string]interface{}{},
			expectedStatusCode: http.StatusOK,
		},
		{
			name:               "system_info execution",
			toolName:           "system_info",
			arguments:          map[string]interface{}{},
			expectedStatusCode: http.StatusOK,
		},
		{
			name:               "unknown tool name",
			toolName:           "non_existent_tool",
			arguments:          map[string]interface{}{},
			expectedStatusCode: http.StatusNotFound,
			expectedErrorCode:  "TOOL_NOT_FOUND",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			payload, _ := json.Marshal(map[string]interface{}{
				"name":      tc.toolName,
				"arguments": tc.arguments,
			})

			req := httptest.NewRequest(http.MethodPost, "/call", bytes.NewReader(payload))
			req.Header.Set("Content-Type", "application/json")
			rr := httptest.NewRecorder()
			mux.ServeHTTP(rr, req)

			if rr.Code != tc.expectedStatusCode {
				t.Fatalf("expected status %d, got %d, body: %s", tc.expectedStatusCode, rr.Code, rr.Body.String())
			}

			var body map[string]interface{}
			if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if tc.expectedErrorCode != "" {
				if code, ok := body["errorCode"].(string); !ok || code != tc.expectedErrorCode {
					t.Errorf("expected errorCode %s, got %v", tc.expectedErrorCode, body["errorCode"])
				}
				if tc.expectedErrorCode == "MISSING_REQUIRED_ARG" {
					if remediation, ok := body["remediation"].(string); !ok || remediation == "" {
						t.Errorf("expected remediation guidance in error response, got empty")
					}
				}
			} else {
				if status, ok := body["status"].(string); !ok || status != "executed" {
					t.Errorf("expected status 'executed', got %v", body["status"])
				}
			}
		})
	}
}

func TestStandaloneServerHistoryAndClear(t *testing.T) {
	server := SetupStandaloneServer()
	mux := http.NewServeMux()
	server.SetupRoutes(mux)

	// Execute a valid tool call
	payload, _ := json.Marshal(map[string]interface{}{
		"name":      "system_info",
		"arguments": map[string]interface{}{},
	})
	req := httptest.NewRequest(http.MethodPost, "/call", bytes.NewReader(payload))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("call failed: %d", rr.Code)
	}

	// Query history
	histReq := httptest.NewRequest(http.MethodGet, "/history", nil)
	histRR := httptest.NewRecorder()
	mux.ServeHTTP(histRR, histReq)
	if histRR.Code != http.StatusOK {
		t.Fatalf("history get failed: %d", histRR.Code)
	}

	if !strings.Contains(histRR.Body.String(), "system_info") {
		t.Errorf("expected system_info in history, got %s", histRR.Body.String())
	}

	// Delete history
	delReq := httptest.NewRequest(http.MethodDelete, "/history", nil)
	delRR := httptest.NewRecorder()
	mux.ServeHTTP(delRR, delReq)
	if delRR.Code != http.StatusOK {
		t.Fatalf("history delete failed: %d", delRR.Code)
	}

	// Query history again, should be empty
	histReq2 := httptest.NewRequest(http.MethodGet, "/history", nil)
	histRR2 := httptest.NewRecorder()
	mux.ServeHTTP(histRR2, histReq2)
	var histResp struct {
		History []interface{} `json:"history"`
	}
	_ = json.Unmarshal(histRR2.Body.Bytes(), &histResp)
	if len(histResp.History) != 0 {
		t.Errorf("expected 0 history records after delete, got %d", len(histResp.History))
	}
}
