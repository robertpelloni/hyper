package agent

import (
	"fmt"
	"time"
)

type Harness struct {
	isRunning bool
	history   []string
}

func NewHarness() *Harness {
	return &Harness{
		isRunning: false,
		history:   make([]string, 0),
	}
}

func (h *Harness) Start() {
	h.isRunning = true
}

func (h *Harness) Execute(command string) (string, error) {
	if !h.isRunning {
		return "", fmt.Errorf("harness not running")
	}
	h.history = append(h.history, command)
	return fmt.Sprintf("Executed at %s: %s", time.Now().Format(time.Kitchen), command), nil
}

func (h *Harness) GetHistory() []string {
	return h.history
}
