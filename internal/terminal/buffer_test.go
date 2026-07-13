package terminal

import "testing"

func TestBufferBlocks(t *testing.T) {
	buf := NewBuffer()
	buf.StartCommand("1", "ls")
	buf.AppendOutput("file.txt")
	buf.EndCommand(0)

	blocks := buf.GetBlocks()
	if len(blocks) != 1 {
		t.Fatalf("Expected 1 block, got %d", len(blocks))
	}
	if blocks[0].Status != BlockSuccess {
		t.Errorf("Expected BlockSuccess, got %v", blocks[0].Status)
	}
}
