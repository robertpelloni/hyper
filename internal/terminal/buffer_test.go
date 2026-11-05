package terminal

import "testing"

func TestBufferBlocks(t *testing.T) {
	buf := &Buffer{}
	if len(buf.Blocks) != 0 {
		t.Fatalf("expected 0 blocks, got %d", len(buf.Blocks))
	}

	buf.AddBlock("ls -la", "total 0", true)
	if len(buf.Blocks) != 1 {
		t.Fatalf("expected 1 block, got %d", len(buf.Blocks))
	}

	b := buf.Blocks[0]
	if b.Command != "ls -la" || b.Output != "total 0" || !b.Success {
		t.Errorf("unexpected block data: %+v", b)
	}
}
