package agent

import (
	"fmt"
	"os"
	"os/exec"
)

type ToolBox struct{}

// Claude Code parity: Agentic Filesystem tools
func (tb *ToolBox) ListFiles(path string) ([]string, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}
	var names []string
	for _, e := range entries {
		names = append(names, e.Name())
	}
	return names, nil
}

func (tb *ToolBox) ReadFile(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// Git Management tools
func (tb *ToolBox) GitStatus() (string, error) {
	cmd := exec.Command("git", "status")
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git status error: %w, output: %s", err, string(out))
	}
	return string(out), nil
}
