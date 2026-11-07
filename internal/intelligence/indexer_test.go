package intelligence

import (
	"os"
	"path/filepath"
	"testing"
)

func TestBasicIndexer(t *testing.T) {
	tempDir := t.TempDir()

	file1 := filepath.Join(tempDir, "sample.txt")
	file2 := filepath.Join(tempDir, "config.json")

	if err := os.WriteFile(file1, []byte("Hello TormentNexus world!"), 0644); err != nil {
		t.Fatalf("failed to write test file 1: %v", err)
	}
	if err := os.WriteFile(file2, []byte(`{"version": "1.1.0"}`), 0644); err != nil {
		t.Fatalf("failed to write test file 2: %v", err)
	}

	indexer := NewBasicIndexer(tempDir)
	if err := indexer.Index(tempDir); err != nil {
		t.Fatalf("expected nil error on Index, got: %v", err)
	}

	results, err := indexer.Search("TormentNexus")
	if err != nil {
		t.Fatalf("expected nil error on Search, got: %v", err)
	}
	if len(results) != 1 || results[0] != file1 {
		t.Fatalf("expected search to find file1, got: %v", results)
	}

	results2, err := indexer.Search("version")
	if err != nil {
		t.Fatalf("expected nil error on Search, got: %v", err)
	}
	if len(results2) != 1 || results2[0] != file2 {
		t.Fatalf("expected search to find file2, got: %v", results2)
	}

	resultsEmpty, err := indexer.Search("")
	if err != nil || len(resultsEmpty) != 0 {
		t.Fatalf("expected empty search to return empty slice, got: %v", resultsEmpty)
	}
}
