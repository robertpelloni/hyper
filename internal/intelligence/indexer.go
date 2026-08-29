package intelligence

import (
	"fmt"
	"strings"
	"sync"
)

type Indexer interface {
	Index(path string) error
	Search(query string) ([]string, error)
	GetContextForCommand(command string) string
}

type BasicIndexer struct {
	RootPath string
	mu       sync.RWMutex
	docs     map[string]string // simple in-memory document store mapping path to content
}

func NewBasicIndexer(root string) *BasicIndexer {
	return &BasicIndexer{
		RootPath: root,
		docs:     make(map[string]string),
	}
}

func (i *BasicIndexer) Index(path string) error {
	i.mu.Lock()
	defer i.mu.Unlock()

	// Simulate Codex-like semantic parsing and indexing
	i.docs[path] = fmt.Sprintf("Simulated semantic content for %s", path)
	return nil
}

func (i *BasicIndexer) Search(query string) ([]string, error) {
	i.mu.RLock()
	defer i.mu.RUnlock()

	var results []string
	for path, content := range i.docs {
		if strings.Contains(strings.ToLower(content), strings.ToLower(query)) || strings.Contains(strings.ToLower(path), strings.ToLower(query)) {
			results = append(results, path)
		}
	}

	return results, nil
}

// GetContextForCommand simulates retrieving relevant local codebase context based on a terminal command
func (i *BasicIndexer) GetContextForCommand(command string) string {
	if strings.HasPrefix(command, "git") {
		return "Context: project uses standard git flow"
	}
	return "Context: general workspace command"
}
