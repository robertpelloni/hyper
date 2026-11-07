package agent

import (
	"context"
	"testing"
	"time"
)

func TestInternalAgentRunLoopAndCancel(t *testing.T) {
	ag := NewAgent()
	if ag == nil {
		t.Fatal("expected NewAgent to return non-nil")
	}

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)

	go func() {
		done <- ag.RunLoop(ctx)
	}()

	time.Sleep(20 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err != context.Canceled {
			t.Errorf("expected context.Canceled, got: %v", err)
		}
	case <-time.After(1 * time.Second):
		t.Fatal("agent run loop did not terminate after cancel")
	}
}

func TestTabbyProtocolCompat(t *testing.T) {
	tabby := &TabbyProtocol{Endpoint: "http://localhost:8080"}
	res, err := tabby.Initialize(TabbyInitializeParams{
		ClientInfo: ClientInfo{Name: "TormentNexus", Version: "1.1.0"},
	})
	if err != nil {
		t.Fatalf("unexpected error on Initialize: %v", err)
	}
	if len(res) == 0 {
		t.Error("expected non-empty initialization result")
	}

	comp, err := tabby.Completion("func main()")
	if err != nil {
		t.Fatalf("unexpected error on Completion: %v", err)
	}
	if len(comp) == 0 {
		t.Error("expected non-empty completion string")
	}
}
