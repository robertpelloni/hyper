package agent

import (
	"context"
	"sync"
)

type Agent struct {
	mu sync.RWMutex
	Messages []string
}

func NewAgent() *Agent {
	return &Agent{}
}

func (a *Agent) RunLoop(ctx context.Context) error {
	// Autonomous execution loop from submodules/pi-mono/pkg/agent/agent.go
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			// Execute agent steps: Think -> Act -> Observe
		}
	}
}
