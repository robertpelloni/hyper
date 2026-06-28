package codex

import "strings"

type GhostTextManager struct{}

func NewGhostTextManager() *GhostTextManager {
	return &GhostTextManager{}
}

func (g *GhostTextManager) Suggest(input string, cursorPosition int) string {
	if strings.HasPrefix(input, "git c") {
		return "ommit -m \"update\""
	}
	if strings.HasPrefix(input, "go r") {
		return "un main.go"
	}
	return ""
}

func (g *GhostTextManager) Render(input string, suggestion string) string {
	return input + "\033[90m" + suggestion + "\033[0m"
}
