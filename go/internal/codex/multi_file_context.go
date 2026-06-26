package codex

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type MultiFileContext struct{}

func NewMultiFileContext() *MultiFileContext {
	return &MultiFileContext{}
}

func (m *MultiFileContext) GatherContext(directory string, maxFiles int) string {
	var context strings.Builder
	fileCount := 0

	files, err := os.ReadDir(directory)
	if err != nil {
		return ""
	}

	for _, file := range files {
		if fileCount >= maxFiles {
			break
		}

		if !file.IsDir() && !strings.HasPrefix(file.Name(), ".") {
			fullPath := filepath.Join(directory, file.Name())
			content, err := os.ReadFile(fullPath)
			if err == nil {
				context.WriteString(fmt.Sprintf("\n--- File: %s ---\n", file.Name()))

				text := string(content)
				if len(text) > 1000 {
					text = text[:1000]
				}
				context.WriteString(text)
				fileCount++
			}
		}
	}
	return context.String()
}