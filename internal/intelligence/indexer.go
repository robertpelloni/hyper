package intelligence

import (
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type Indexer interface {
	Index(path string) error
	Search(query string) ([]string, error)
}

// BasicIndexer indexes file paths and contents in-memory for fast context retrieval
type BasicIndexer struct {
	RootPath string
	files    map[string]string // path -> content
	mu       sync.RWMutex
}

func NewBasicIndexer(root string) *BasicIndexer {
	return &BasicIndexer{
		RootPath: root,
		files:    make(map[string]string),
	}
}

func (i *BasicIndexer) Index(path string) error {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.files == nil {
		i.files = make(map[string]string)
	}

	target := path
	if target == "" {
		target = i.RootPath
	}

	return filepath.Walk(target, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // skip unreadable files gracefully
		}
		if info.IsDir() {
			// Skip hidden and vendor directories
			base := filepath.Base(p)
			if strings.HasPrefix(base, ".") && base != "." {
				return filepath.SkipDir
			}
			if base == "node_modules" || base == "vendor" || base == "dist" {
				return filepath.SkipDir
			}
			return nil
		}

		// Only index text files under 256KB
		if info.Size() > 256*1024 {
			return nil
		}

		content, readErr := os.ReadFile(p)
		if readErr == nil {
			i.files[p] = string(content)
		}
		return nil
	})
}

func (i *BasicIndexer) Search(query string) ([]string, error) {
	i.mu.RLock()
	defer i.mu.RUnlock()

	if query == "" {
		return []string{}, nil
	}

	q := strings.ToLower(query)
	results := make([]string, 0)

	for p, content := range i.files {
		if strings.Contains(strings.ToLower(p), q) || strings.Contains(strings.ToLower(content), q) {
			results = append(results, p)
		}
	}

	return results, nil
}
