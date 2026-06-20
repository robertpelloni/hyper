package claude_code

// Re-implementation of Claude Code's Slash Command Router

import (
	"errors"
	"fmt"
	"strings"
)

type CommandHandler func(args []string) (string, error)

type SlashCommandRouter struct {
	commands map[string]CommandHandler
}

func NewSlashCommandRouter() *SlashCommandRouter {
	return &SlashCommandRouter{
		commands: make(map[string]CommandHandler),
	}
}

func (r *SlashCommandRouter) RegisterCommand(command string, handler CommandHandler) error {
	if !strings.HasPrefix(command, "/") {
		return errors.New("Slash commands must start with '/'")
	}
	r.commands[command] = handler
	return nil
}

func (r *SlashCommandRouter) IsSlashCommand(input string) bool {
	return strings.HasPrefix(strings.TrimSpace(input), "/")
}

func (r *SlashCommandRouter) ExecuteCommand(input string) (string, error) {
	parts := strings.Fields(strings.TrimSpace(input))
	if len(parts) == 0 {
		return "", errors.New("Empty command.")
	}

	cmd := parts[0]
	args := parts[1:]

	handler, exists := r.commands[cmd]
	if !exists {
		return fmt.Sprintf("Unknown command: %s. Type /help for available commands.", cmd), nil
	}

	return handler(args)
}
