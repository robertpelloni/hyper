package cli

import (
	"fmt"
	"io/ioutil"
	"os/exec"
)

// ReadFile reads the contents of a file
func ReadFile(path string) (string, error) {
	content, err := ioutil.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read file %s: %v", path, err)
	}
	return string(content), nil
}

// WriteFile writes contents to a file
func WriteFile(path string, content string) error {
	err := ioutil.WriteFile(path, []byte(content), 0644)
	if err != nil {
		return fmt.Errorf("failed to write to file %s: %v", path, err)
	}
	return nil
}

// ExecuteGit runs a git command in the specified directory
func ExecuteGit(dir string, args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	if err != nil {
		return string(out), fmt.Errorf("git command failed: %v", err)
	}
	return string(out), nil
}
