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
	if !ag.IsRunning() {
		t.Error("expected agent to be running")
	}

	cancel()

	select {
	case err := <-done:
		if err != context.Canceled {
			t.Errorf("expected context.Canceled, got: %v", err)
		}
	case <-time.After(1 * time.Second):
		t.Fatal("agent run loop did not terminate after cancel")
	}

	if ag.IsRunning() {
		t.Error("expected agent to stop running after cancel")
	}
}

func TestInternalAgentReasoningSteps(t *testing.T) {
	ag := NewAgent()

	var recordedStep ReasoningStep
	ag.SetStepCallback(func(s ReasoningStep) {
		recordedStep = s
	})

	step := ag.RecordStep(StepPlan, "Synthesizing execution plan", "planner", 15)
	if step.Type != StepPlan {
		t.Errorf("expected step type %s, got %s", StepPlan, step.Type)
	}
	if recordedStep.ID != step.ID {
		t.Errorf("callback not invoked with matching step ID")
	}

	ag.RecordStep(StepThink, "Evaluating MCP tools", "", 10)
	ag.RecordStep(StepAct, "Calling shell_execute", "shell_execute", 25)
	ag.RecordStep(StepObserve, "Output received: 200 OK", "shell_execute", 5)
	ag.RecordStep(StepReflect, "Task complete with zero errors", "", 2)

	steps := ag.GetSteps()
	if len(steps) != 5 {
		t.Fatalf("expected 5 recorded steps, got %d", len(steps))
	}

	ag.AddMessage("User: Execute test")
	ag.AddMessage("Agent: Executed test successfully")
	msgs := ag.GetMessages()
	if len(msgs) != 2 {
		t.Fatalf("expected 2 messages, got %d", len(msgs))
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
