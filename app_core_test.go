package main

import (
	"context"
	"testing"
	"time"
)

func TestAgentHarnessLifecycle(t *testing.T) {
	agent := NewAgentHarness()
	if agent == nil {
		t.Fatal("expected NewAgentHarness to return non-nil")
	}

	st := agent.GetStatus()
	if st["status"] != "idle" || st["running"] != false {
		t.Fatalf("expected initial idle state, got: %+v", st)
	}

	res := agent.ExecuteCommand("start")
	if res["status"] != "running" {
		t.Fatalf("expected status running after start, got: %+v", res)
	}

	time.Sleep(50 * time.Millisecond)
	st = agent.GetStatus()
	if st["running"] != true {
		t.Fatalf("expected agent to be running, got: %+v", st)
	}

	stopRes := agent.ExecuteCommand("stop")
	if stopRes["status"] != "stopped" {
		t.Fatalf("expected status stopped after stop, got: %+v", stopRes)
	}

	st = agent.GetStatus()
	if st["running"] != false {
		t.Fatalf("expected agent not running after stop, got: %+v", st)
	}
}

func TestAgentAutonomousMCPToolUse(t *testing.T) {
	agent := NewAgentHarness()
	mcp := NewMCPAggregator()
	agent.SetMCPAggregator(mcp)

	// Dispatch an autonomous command requiring MCP tool use
	res := agent.ExecuteCommand("scan_sessions")
	if res["status"] == "" {
		t.Error("expected non-empty status")
	}

	time.Sleep(50 * time.Millisecond)
	steps := agent.GetExecutionSteps()
	if len(steps) < 4 {
		t.Fatalf("expected at least 4 steps across PLAN, THINK, ACT, OBSERVE, REFLECT, got %d", len(steps))
	}

	foundAct := false
	foundPlan := false
	foundReflect := false
	for _, s := range steps {
		if s.Phase == "PLAN" {
			foundPlan = true
		}
		if s.Phase == "ACT" && s.Tool == "session_list" {
			foundAct = true
		}
		if s.Phase == "REFLECT" {
			foundReflect = true
		}
	}
	if !foundPlan {
		t.Error("expected PLAN phase step")
	}
	if !foundAct {
		t.Error("expected ACT step with session_list tool")
	}
	if !foundReflect {
		t.Error("expected REFLECT phase step")
	}

	// Test task queue operations
	qRes := agent.QueueTask("autonomous_audit")
	if qRes["status"] != "queued" {
		t.Errorf("expected queued status, got: %+v", qRes)
	}
	queue := agent.GetTaskQueue()
	if len(queue) != 1 || queue[0] != "autonomous_audit" {
		t.Errorf("unexpected task queue state: %+v", queue)
	}
	cleared := agent.ClearTaskQueue()
	if len(cleared) != 0 || len(agent.GetTaskQueue()) != 0 {
		t.Errorf("expected empty queue after clear, got %d", len(agent.GetTaskQueue()))
	}

	// Test task queue execution processing
	agent.QueueTask("task_one")
	agent.QueueTask("task_two")
	if len(agent.GetTaskQueue()) != 2 {
		t.Errorf("expected 2 tasks in queue, got %d", len(agent.GetTaskQueue()))
	}
	popped := agent.ProcessNextTask()
	if popped != "task_one" {
		t.Errorf("expected popped task to be task_one, got %s", popped)
	}
	if len(agent.GetTaskQueue()) != 1 {
		t.Errorf("expected 1 task remaining after ProcessNextTask, got %d", len(agent.GetTaskQueue()))
	}
	agent.ClearTaskQueue()
}

func TestMCPAggregatorTools(t *testing.T) {
	agg := NewMCPAggregator()
	if agg == nil {
		t.Fatal("expected NewMCPAggregator to return non-nil")
	}

	tools := agg.ListTools()
	if len(tools) == 0 {
		t.Fatal("expected built-in tools to be present")
	}

	hasShellExecute := false
	for _, tool := range tools {
		if tool.Name == "shell_execute" {
			hasShellExecute = true
			break
		}
	}
	if !hasShellExecute {
		t.Error("expected shell_execute tool to be registered")
	}

	callRes := agg.CallTool("shell_execute", map[string]interface{}{"command": "echo test"})
	if callRes["status"] != "executed" {
		t.Fatalf("expected executed status for shell_execute, got: %+v", callRes)
	}

	telemetry := agg.GetTelemetry()
	if telemetry["status"] != "active" {
		t.Fatalf("expected active telemetry, got: %+v", telemetry)
	}
}

func TestAppServerStatusAndTray(t *testing.T) {
	app := NewApp()
	app.agent = NewAgentHarness()
	app.sessions = NewSessionManager()

	status := app.GetServerStatus()
	if status.Version != "1.1.0" {
		t.Errorf("expected version 1.1.0, got: %s", status.Version)
	}
	if status.MCPServerPort != 8080 {
		t.Errorf("expected port 8080, got: %d", status.MCPServerPort)
	}

	// Test tray toggle
	initialTray := app.trayVisible
	newTray := app.ToggleSystemTray()
	if newTray == initialTray {
		t.Errorf("expected tray state to flip from %v, got %v", initialTray, newTray)
	}

	app.shutdown(context.Background())
}
