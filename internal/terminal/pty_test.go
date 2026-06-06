package terminal

import (
	"context"
	"testing"
)

func TestNewSession(t *testing.T) {
	ctx := context.Background()
	s, err := NewSession(ctx, "/bin/sh", []string{"-c", "echo hello"}, nil)
	if err != nil {
		t.Fatalf("Failed to create session: %v", err)
	}
	defer s.Close()
}
