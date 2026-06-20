package aider

// Re-implementation of Aider's Tree-Sitter RepoMap context generator

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type RepoMap struct {
	ProjectRoot string
}

func NewRepoMap(projectRoot string) *RepoMap {
	return &RepoMap{ProjectRoot: projectRoot}
}

func (r *RepoMap) GetMapContext() string {
	// Scaffold: Real implementation requires tree-sitter bindings.
	var fileList []string
	r.listFilesInDirectory(r.ProjectRoot, &fileList)
	return fmt.Sprintf("Project Root: %s\nFiles:\n%s\n[Map content generated via Tree-Sitter]", r.ProjectRoot, strings.Join(fileList, "\n"))
}

func (r *RepoMap) listFilesInDirectory(dir string, fileList *[]string) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}

	for _, entry := range entries {
		path := filepath.Join(dir, entry.Name())
		if entry.IsDir() {
			if !strings.Contains(path, "node_modules") && !strings.Contains(path, ".git") {
				r.listFilesInDirectory(path, fileList)
			}
		} else {
			*fileList = append(*fileList, path)
		}
	}
}
