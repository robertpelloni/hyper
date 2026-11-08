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

	// Test dynamic parameterized directive
	agent.ExecuteCommand("file_read:VERSION.md")
	time.Sleep(50 * time.Millisecond)
	steps = agent.GetExecutionSteps()
	foundFileRead := false
	for _, s := range steps {
		if s.Tool == "file_read" && s.Phase == "ACT" {
			foundFileRead = true
			if s.Input["path"] != "VERSION.md" {
				t.Errorf("expected path VERSION.md, got: %+v", s.Input)
			}
		}
	}
	if !foundFileRead {
		t.Error("expected ACT step with file_read tool and path input")
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

	// Test Terminal Buffer bindings
	blk := app.RecordTerminalCommand("git status", "On branch main", true)
	if blk.Command != "git status" {
		t.Errorf("unexpected command: %s", blk.Command)
	}

	hist := app.GetTerminalHistory()
	if len(hist) != 1 {
		t.Errorf("expected 1 history item, got %d", len(hist))
	}

	searchRes := app.SearchTerminalHistory("branch")
	if len(searchRes) != 1 {
		t.Errorf("expected 1 search result for 'branch', got %d", len(searchRes))
	}

	app.ClearTerminalHistory()
	if len(app.GetTerminalHistory()) != 0 {
		t.Errorf("expected empty history after ClearTerminalHistory")
	}

	app.shutdown(context.Background())
}

func TestMCPWorkspaceAndGitTools(t *testing.T) {
	agg := NewMCPAggregator()

	// Verify categories and existence of newly added tools
	tools := agg.ListTools()
	foundWorkspace := false
	foundGit := false
	foundSysInfo := false

	for _, tool := range tools {
		if tool.Name == "workspace_search" {
			foundWorkspace = true
			if tool.Category != "Intelligence" {
				t.Errorf("expected Intelligence category for workspace_search, got: %s", tool.Category)
			}
		}
		if tool.Name == "git_status" {
			foundGit = true
			if tool.Category != "System" {
				t.Errorf("expected System category for git_status, got: %s", tool.Category)
			}
		}
		if tool.Name == "system_info" {
			foundSysInfo = true
			if tool.Category != "System" {
				t.Errorf("expected System category for system_info, got: %s", tool.Category)
			}
		}
	}

	if !foundWorkspace {
		t.Error("expected workspace_search tool to be registered")
	}
	if !foundGit {
		t.Error("expected git_status tool to be registered")
	}
	if !foundSysInfo {
		t.Error("expected system_info tool to be registered")
	}

	// Verify tool executions and timing metrics
	wsRes := agg.CallTool("workspace_search", map[string]interface{}{"query": "TormentNexus"})
	if wsRes["statusCode"] != 200 || wsRes["status"] != "executed" {
		t.Errorf("expected 200 executed for workspace_search, got: %+v", wsRes)
	}

	gitRes := agg.CallTool("git_status", map[string]interface{}{})
	if gitRes["statusCode"] != 200 || gitRes["status"] != "executed" {
		t.Errorf("expected 200 executed for git_status, got: %+v", gitRes)
	}

	sysRes := agg.CallTool("system_info", map[string]interface{}{})
	if sysRes["statusCode"] != 200 || sysRes["status"] != "executed" {
		t.Errorf("expected 200 executed for system_info, got: %+v", sysRes)
	}

	// Verify execution history recorded
	hist := agg.GetToolExecutionHistory()
	if len(hist) < 3 {
		t.Errorf("expected at least 3 execution records, got %d", len(hist))
	}
}

func TestAgentWorkspaceSearchDirective(t *testing.T) {
	agent := NewAgentHarness()
	mcp := NewMCPAggregator()
	agent.SetMCPAggregator(mcp)

	// Test workspace_search directive
	agent.ExecuteCommand("workspace_search:main")
	time.Sleep(50 * time.Millisecond)

	steps := agent.GetExecutionSteps()
	foundWorkspaceStep := false
	for _, s := range steps {
		if s.Tool == "workspace_search" && s.Phase == "ACT" {
			foundWorkspaceStep = true
			if s.Input["query"] != "main" {
				t.Errorf("expected query 'main', got: %+v", s.Input)
			}
		}
	}
	if !foundWorkspaceStep {
		t.Error("expected ACT step with workspace_search tool and query 'main'")
	}

	// Test git_status directive
	agent.ExecuteCommand("git_status")
	time.Sleep(50 * time.Millisecond)

	steps = agent.GetExecutionSteps()
	foundGitStep := false
	for _, s := range steps {
		if s.Tool == "git_status" && s.Phase == "ACT" {
			foundGitStep = true
		}
	}
	if !foundGitStep {
		t.Error("expected ACT step with git_status tool")
	}

	// Test system_info directive
	agent.ExecuteCommand("system_info")
	time.Sleep(50 * time.Millisecond)

	steps = agent.GetExecutionSteps()
	foundSysStep := false
	for _, s := range steps {
		if s.Tool == "system_info" && s.Phase == "ACT" {
			foundSysStep = true
		}
	}
	if !foundSysStep {
		t.Error("expected ACT step with system_info tool")
	}
}
