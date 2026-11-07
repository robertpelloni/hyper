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
	var missingResp map[string]interface{}
	_ = json.Unmarshal(rrMissing.Body.Bytes(), &missingResp)
	if missingResp["errorCode"] != "TOOL_NOT_FOUND" {
		t.Errorf("expected errorCode TOOL_NOT_FOUND, got %v", missingResp["errorCode"])
	}

	// 5. Test POST /call with malformed JSON
	badPayload := []byte(`{invalid-json`)
	reqBad, _ := http.NewRequest(http.MethodPost, "/call", bytes.NewBuffer(badPayload))
	rrBad := httptest.NewRecorder()
	mux.ServeHTTP(rrBad, reqBad)

	if rrBad.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request for bad JSON, got %d", rrBad.Code)
	}
	var badResp map[string]interface{}
	_ = json.Unmarshal(rrBad.Body.Bytes(), &badResp)
	if badResp["errorCode"] != "INVALID_ARGUMENTS" {
		t.Errorf("expected errorCode INVALID_ARGUMENTS, got %v", badResp["errorCode"])
	}

	// 5b. Test POST /call with oversized payload (> 1MB)
	// Must be valid JSON prefix so JSON decoder reads until exceeding 1MB limit
	hugePrefix := []byte(`{"name":"unit_test_tool","arguments":{"pad":"`)
	hugeSuffix := []byte(`"}}`)
	hugePad := make([]byte, 1048576+100)
	for i := range hugePad {
		hugePad[i] = 'a'
	}
	hugePayload := append(hugePrefix, hugePad...)
	hugePayload = append(hugePayload, hugeSuffix...)

	reqHuge, _ := http.NewRequest(http.MethodPost, "/call", bytes.NewBuffer(hugePayload))
	rrHuge := httptest.NewRecorder()
	mux.ServeHTTP(rrHuge, reqHuge)
	if rrHuge.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("expected 413 Request Entity Too Large, got %d. Body: %s", rrHuge.Code, rrHuge.Body.String())
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

	// 7. Test Empty Tool Name edge case
	emptyToolPayload := []byte(`{"name": "", "arguments": {}}`)
	reqEmpty, _ := http.NewRequest(http.MethodPost, "/call", bytes.NewBuffer(emptyToolPayload))
	rrEmpty := httptest.NewRecorder()
	mux.ServeHTTP(rrEmpty, reqEmpty)

	if rrEmpty.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for empty tool name, got %d", rrEmpty.Code)
	}
	var emptyResp map[string]interface{}
	_ = json.Unmarshal(rrEmpty.Body.Bytes(), &emptyResp)
	if emptyResp["errorCode"] != "EMPTY_TOOL_NAME" {
		t.Errorf("expected errorCode EMPTY_TOOL_NAME, got %v", emptyResp["errorCode"])
	}

	// 8. Test History Limit and Concurrency
	for i := 0; i < 110; i++ {
		p := []byte(`{"name": "unit_test_tool", "arguments": {}}`)
		r, _ := http.NewRequest(http.MethodPost, "/call", bytes.NewBuffer(p))
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, r)
	}
	historyRecords := server.GetHistory()
	if len(historyRecords) > 100 {
		t.Errorf("expected history capped at 100 records, got %d", len(historyRecords))
	}
}
