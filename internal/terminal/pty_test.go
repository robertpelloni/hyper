package terminal

import (
	"testing"
)

func TestNewSession(t *testing.T) {
	// Simple test to ensure NewSession doesn't crash
	s, err := NewSession("/bin/sh", []string{"-c", "echo hello"})
	if err != nil {
		t.Fatalf("Failed to create session: %v", err)
	}
	defer s.Close()
}
