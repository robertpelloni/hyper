package agent

import (
	"context"
	"sync"
	"time"

	"tormentnexus/internal/intelligence"
)

type Agent struct {
	mu       sync.RWMutex
	Messages []string
	Indexer  intelligence.Indexer
}

func NewAgent() *Agent {
	return &Agent{
		Indexer: intelligence.NewBasicIndexer("."),
	}
}

func (a *Agent) RunLoop(ctx context.Context) error {
	// Autonomous execution loop from submodules/pi-mono/pkg/agent/agent.go
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(5 * time.Second):
			// Execute agent steps: Think -> Act -> Observe
		}
	}
}

func (a *Agent) HandleCommand(cmd string) string {
	// Codex-like context enhancement for terminal commands
	contextStr := a.Indexer.GetContextForCommand(cmd)
	return contextStr
}
