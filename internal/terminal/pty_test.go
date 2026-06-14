package terminal

import (
	"testing"
)

func TestPTYManager(t *testing.T) {
	m := NewPTYManager()
	if m == nil {
		t.Fatal("Failed to create PTY manager")
	}
}

func TestBuffer(t *testing.T) {
	b := &Buffer{}
	b.AddBlock("ls", "file1\nfile2", true)
	if len(b.Blocks) != 1 {
		t.Fatalf("Expected 1 block, got %d", len(b.Blocks))
	}
	if b.Blocks[0].Command != "ls" {
		t.Fatalf("Expected command 'ls', got '%s'", b.Blocks[0].Command)
	}
}
