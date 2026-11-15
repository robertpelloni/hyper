package terminal

import "testing"

func TestBufferBlocks(t *testing.T) {
	buf := NewBuffer()
	if len(buf.GetBlocks()) != 0 {
		t.Fatalf("expected 0 blocks, got %d", len(buf.GetBlocks()))
	}

	blk := buf.AddBlock("ls -la", "total 0", true)
	if len(buf.GetBlocks()) != 1 {
		t.Fatalf("expected 1 block, got %d", len(buf.GetBlocks()))
	}

	if blk.Command != "ls -la" || blk.Output != "total 0" || !blk.Success {
		t.Errorf("unexpected block data: %+v", blk)
	}

	buf.AddBlock("cat VERSION.md", "1.1.0", true)
	buf.AddBlock("npm test", "FAIL: 1 error", false)

	if len(buf.GetBlocks()) != 3 {
		t.Fatalf("expected 3 blocks, got %d", len(buf.GetBlocks()))
	}

	// Test SearchBlocks
	results := buf.SearchBlocks("VERSION")
	if len(results) != 1 || results[0].Command != "cat VERSION.md" {
		t.Errorf("expected 1 result for 'VERSION', got: %+v", results)
	}

	failResults := buf.SearchBlocks("error")
	if len(failResults) != 1 || failResults[0].Command != "npm test" {
		t.Errorf("expected 1 result for 'error', got: %+v", failResults)
	}

	allResults := buf.SearchBlocks("")
	if len(allResults) != 3 {
		t.Errorf("expected 3 results for empty search query, got %d", len(allResults))
	}

	// Test Clear
	buf.Clear()
	if len(buf.GetBlocks()) != 0 {
		t.Errorf("expected 0 blocks after Clear(), got %d", len(buf.GetBlocks()))
	}
}
