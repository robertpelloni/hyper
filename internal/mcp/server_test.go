package mcp

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestServerEndpoints(t *testing.T) {
	server := NewServer()
	server.RegisterTool(Tool{
		Name:        "unit_test_tool",
		Description: "A mock tool for testing HTTP endpoints",
		InputSchema: map[string]interface{}{"type": "object"},
	})

	mux := http.NewServeMux()
	server.SetupRoutes(mux)

	// 1. Test GET /tools
	req, _ := http.NewRequest(http.MethodGet, "/tools", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /tools, got %d", rr.Code)
	}

	var toolsResp map[string][]Tool
	if err := json.Unmarshal(rr.Body.Bytes(), &toolsResp); err != nil {
		t.Fatalf("failed to decode /tools JSON: %v", err)
	}
	if len(toolsResp["tools"]) != 1 || toolsResp["tools"][0].Name != "unit_test_tool" {
		t.Fatalf("unexpected tools response: %+v", toolsResp)
	}

	// 2. Test GET /call (should return info message)
	reqGetCall, _ := http.NewRequest(http.MethodGet, "/call", nil)
	rrGetCall := httptest.NewRecorder()
	mux.ServeHTTP(rrGetCall, reqGetCall)
	if rrGetCall.Code != http.StatusOK {
		t.Errorf("expected 200 OK from GET /call, got %d", rrGetCall.Code)
	}

	// 3. Test POST /call with valid tool
	validPayload := []byte(`{"name": "unit_test_tool", "arguments": {"param1": "val1"}}`)
	reqPost, _ := http.NewRequest(http.MethodPost, "/call", bytes.NewBuffer(validPayload))
	reqPost.Header.Set("Content-Type", "application/json")
	rrPost := httptest.NewRecorder()
	mux.ServeHTTP(rrPost, reqPost)

	if rrPost.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from POST /call, got %d: %s", rrPost.Code, rrPost.Body.String())
	}

	var callResp map[string]interface{}
	if err := json.Unmarshal(rrPost.Body.Bytes(), &callResp); err != nil {
		t.Fatalf("failed to decode POST /call response: %v", err)
	}
	if callResp["status"] != "executed" || callResp["tool"] != "unit_test_tool" {
		t.Fatalf("unexpected call response: %+v", callResp)
	}
	if callResp["statusCode"].(float64) != 200 {
		t.Errorf("expected statusCode 200, got %v", callResp["statusCode"])
	}

	// 4. Test POST /call with non-existent tool
	missingPayload := []byte(`{"name": "unknown_tool", "arguments": {}}`)
	reqMissing, _ := http.NewRequest(http.MethodPost, "/call", bytes.NewBuffer(missingPayload))
	rrMissing := httptest.NewRecorder()
	mux.ServeHTTP(rrMissing, reqMissing)

	if rrMissing.Code != http.StatusNotFound {
		t.Fatalf("expected 404 Not Found for missing tool, got %d", rrMissing.Code)
	}

	// 5. Test POST /call with malformed JSON
	badPayload := []byte(`{invalid-json`)
	reqBad, _ := http.NewRequest(http.MethodPost, "/call", bytes.NewBuffer(badPayload))
	rrBad := httptest.NewRecorder()
	mux.ServeHTTP(rrBad, reqBad)

	if rrBad.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request for bad JSON, got %d", rrBad.Code)
	}

	// 6. Test GET /history endpoint
	reqHist, _ := http.NewRequest(http.MethodGet, "/history", nil)
	rrHist := httptest.NewRecorder()
	mux.ServeHTTP(rrHist, reqHist)

	if rrHist.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /history, got %d", rrHist.Code)
	}

	var histResp map[string][]ToolExecutionRecord
	if err := json.Unmarshal(rrHist.Body.Bytes(), &histResp); err != nil {
		t.Fatalf("failed to decode /history response: %v", err)
	}
	if len(histResp["history"]) < 3 {
		t.Errorf("expected at least 3 execution records, got %d", len(histResp["history"]))
	}
}
