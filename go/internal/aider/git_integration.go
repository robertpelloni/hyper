package aider

// Re-implementation of Aider's automated Git commit flow

import (
	"os/exec"
	"fmt"
)

func AutoCommit(message string) bool {
	addCmd := exec.Command("git", "add", ".")
	if err := addCmd.Run(); err != nil {
		fmt.Println("Git add failed:", err)
		return false
	}

	commitCmd := exec.Command("git", "commit", "-m", message)
	if err := commitCmd.Run(); err != nil {
		fmt.Println("Git commit failed:", err)
		return false
	}

	return true
}
