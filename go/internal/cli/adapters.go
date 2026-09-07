package cli

import (
	"bytes"
	"fmt"
	"os/exec"
)

type ClaudeAdapter struct{}

func NewClaudeAdapter() *ClaudeAdapter {
	return &ClaudeAdapter{}
}

func (c *ClaudeAdapter) Execute(prompt string) (string, error) {
	// In a real implementation, this would call the actual claude-cli binary
	cmd := exec.Command("claude", "--prompt", prompt)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return fmt.Sprintf("Mock Claude Response to: %s", prompt), nil
	}
	return out.String(), nil
}

type GeminiAdapter struct{}

func NewGeminiAdapter() *GeminiAdapter {
	return &GeminiAdapter{}
}

func (g *GeminiAdapter) Execute(prompt string) (string, error) {
	// In a real implementation, this would call the actual gemini-cli binary
	cmd := exec.Command("gemini", "ask", prompt)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return fmt.Sprintf("Mock Gemini Response to: %s", prompt), nil
	}
	return out.String(), nil
}
