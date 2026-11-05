package intelligence

import "testing"

func TestBasicIndexer(t *testing.T) {
	indexer := &BasicIndexer{RootPath: "/app"}
	if err := indexer.Index("/app"); err != nil {
		t.Fatalf("expected nil error on Index, got: %v", err)
	}

	results, err := indexer.Search("test")
	if err != nil {
		t.Fatalf("expected nil error on Search, got: %v", err)
	}
	if results == nil {
		t.Error("expected non-nil results slice")
	}
}
