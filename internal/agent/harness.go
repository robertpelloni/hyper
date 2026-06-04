package agent

import (
	"context"
	"sync"
)

type Agent struct {
	mu sync.RWMutex
	// Ported from Pi-Mono
	Messages []string // Simplified for now
}

func NewAgent() *Agent {
	return &Agent{}
}

func (a *Agent) Run(ctx context.Context) error {
	// Execution loop
	return nil
}
