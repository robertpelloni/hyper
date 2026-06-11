package agent

import (
	"testing"
	"strings"
)

func TestHarnessStatus(t *testing.T) {
	h := NewHarness()
	h.Start()
	resp, err := h.Execute("status")
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}
	if !strings.Contains(resp, "operational") {
		t.Errorf("Expected operational status, got: %s", resp)
	}
}
