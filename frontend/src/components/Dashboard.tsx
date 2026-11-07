import React, { useState, useEffect, useCallback } from "react";
import type { AppConfig, SessionInfo, ServerStatus, MCPTool, MCPTelemetry, ToolExecutionRecord, AgentExecutionStep } from "../types";
import * as api from "../api";
import Tooltip from "./Tooltip";

interface DashboardProps {
	config: AppConfig;
	sessions: Record<string, SessionInfo>;
	activeSessionId: string | null;
	onSelectSession: (uid: string) => void;
	onCloseSession: (uid: string) => void;
	onNewSession: () => void;
	onCloseDashboard: () => void;
	onNotification: (text: string) => void;
}

export default function Dashboard({
	config,
	sessions,
	activeSessionId,
	onSelectSession,
	onCloseSession,
	onNewSession,
	onCloseDashboard,
	onNotification,
}: DashboardProps) {
	// Subsystem States
	const [serverStatus, setServerStatus] = useState<ServerStatus>({
		mcpServerRunning: false,
		mcpServerPort: 8080,
		agentRunning: false,
		trayEnabled: true,
		activeSessions: Object.keys(sessions).length,
		uptimeSeconds: 0,
		version: "1.1.0",
	});

	const [agentCommand, setAgentCommand] = useState("");
	const [agentLogs, setAgentLogs] = useState<string[]>([
		"Agent Harness initialized in idle state.",
	]);
	const [agentRunning, setAgentRunning] = useState(false);
	const [agentSteps, setAgentSteps] = useState<AgentExecutionStep[]>([]);
	const [taskQueue, setTaskQueue] = useState<string[]>([]);

	const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
	const [selectedTool, setSelectedTool] = useState<string>("shell_execute");
	const [toolArgs, setToolArgs] = useState('{"command": "echo Hello from TormentNexus"}');
	const [toolOutput, setToolOutput] = useState<string>("");
	const [executionHistory, setExecutionHistory] = useState<ToolExecutionRecord[]>([]);
	const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);
	const [isInvokingTool, setIsInvokingTool] = useState<boolean>(false);

	const [telemetry, setTelemetry] = useState<MCPTelemetry>({
		status: "active",
		active_tools: 0,
		servers: 1,
		version: "1.1.0",
	});

	// Quick Settings state
	const [fontSize, setFontSize] = useState<number>(config.fontSize || 12);
	const [fontFamily, setFontFamily] = useState<string>(config.fontFamily || "monospace");
	const [cursorShape, setCursorShape] = useState<string>(config.cursorShape || "BLOCK");

	// Onboarding Guide banner visibility
	const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
	const [activeOnboardingStep, setActiveOnboardingStep] = useState<number | null>(null);

	// Inline toast banner for feedback
	const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

	const showFeedback = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
		setFeedbackToast({ message, type });
		onNotification(message);
		setTimeout(() => {
			setFeedbackToast((current) => (current?.message === message ? null : current));
		}, 3500);
	}, [onNotification]);

	// Refresh system metrics & tool execution history & agent steps
	const refreshStatus = useCallback(async () => {
		try {
			const st = await api.getServerStatus();
			setServerStatus(st);
			setAgentRunning(st.agentRunning);

			const tools = await api.mcpListTools();
			setMcpTools(tools);

			const tel = await api.mcpGetTelemetry();
			setTelemetry(tel);

			const hist = await api.mcpGetToolExecutionHistory();
			setExecutionHistory(hist);

			const steps = await api.agentGetExecutionSteps();
			if (steps && steps.length > 0) {
				setAgentSteps(steps);
			}

			const queue = await api.agentGetTaskQueue();
			if (queue) {
				setTaskQueue(queue);
			}
		} catch (err) {
			console.warn("Failed to refresh status:", err);
		}
	}, []);

	useEffect(() => {
		refreshStatus();
		const interval = setInterval(refreshStatus, 3000);

		// Real-time step listener
		api.onEvent("agent:step", (step: AgentExecutionStep) => {
			setAgentSteps((prev) => [...prev.slice(-30), step]);
		});

		return () => {
			clearInterval(interval);
			api.offEvent("agent:step");
		};
	}, [refreshStatus]);

	// Global keyboard shortcuts (Escape to close dashboard)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onCloseDashboard();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [onCloseDashboard]);

	// Agent Controls
	const handleAgentStart = async () => {
		try {
			const res = await api.agentExecuteCommand("start");
			setAgentRunning(true);
			setAgentLogs((prev) => [...prev, `[START] ${res.response || "Agent loop running"}`]);
			showFeedback("Autonomous Agent Loop started", "success");
			refreshStatus();
		} catch (err) {
			setAgentLogs((prev) => [...prev, `[ERROR] ${err}`]);
			showFeedback(`Agent start failed: ${err}`, "error");
		}
	};

	const handleAgentStop = async () => {
		try {
			const res = await api.agentExecuteCommand("stop");
			setAgentRunning(false);
			setAgentLogs((prev) => [...prev, `[STOP] ${res.response || "Agent loop stopped"}`]);
			showFeedback("Autonomous Agent Loop stopped", "info");
			refreshStatus();
		} catch (err) {
			setAgentLogs((prev) => [...prev, `[ERROR] ${err}`]);
			showFeedback(`Agent stop failed: ${err}`, "error");
		}
	};

	const handleAgentHealth = async () => {
		try {
			const res = await api.agentHealthCheck();
			setAgentLogs((prev) => [
				...prev,
				`[HEALTH] Status: ${res.status} | Messages: ${res.messages} | Running: ${res.running}`,
			]);
			onNotification("Agent Health Check OK");
		} catch (err) {
			setAgentLogs((prev) => [...prev, `[HEALTH ERROR] ${err}`]);
		}
	};

	const handleAgentExec = async (cmdToRun?: string) => {
		const targetCmd = cmdToRun || agentCommand;
		if (!targetCmd.trim()) return;
		try {
			setAgentLogs((prev) => [...prev, `> ${targetCmd}`]);
			const res = await api.agentExecuteCommand(targetCmd);
			setAgentLogs((prev) => [...prev, `< ${res.response || JSON.stringify(res)}`]);
			if (!cmdToRun) setAgentCommand("");
			refreshStatus();
		} catch (err) {
			setAgentLogs((prev) => [...prev, `[EXEC ERROR] ${err}`]);
		}
	};

	const handleQueueTask = async () => {
		if (!agentCommand.trim()) return;
		try {
			await api.agentQueueTask(agentCommand.trim());
			showFeedback(`Enqueued task: "${agentCommand.trim()}"`, "success");
			setAgentCommand("");
			refreshStatus();
		} catch (err: any) {
			showFeedback(`Failed to queue task: ${err.message || err}`, "error");
		}
	};

	const handleClearQueue = async () => {
		try {
			await api.agentClearTaskQueue();
			showFeedback("Agent task queue cleared", "info");
			refreshStatus();
		} catch (err: any) {
			showFeedback(`Failed to clear queue: ${err.message || err}`, "error");
		}
	};

	// Real-time JSON validation
	useEffect(() => {
		const trimmed = toolArgs.trim();
		if (!trimmed) {
			setJsonValidationError(null);
			return;
		}
		try {
			JSON.parse(trimmed);
			setJsonValidationError(null);
		} catch (err: any) {
			setJsonValidationError(err.message || "Invalid JSON syntax");
		}
	}, [toolArgs]);

	const defaultTemplates: Record<string, string> = {
		shell_execute: '{"command": "echo Hello from TormentNexus"}',
		file_read: '{"path": "VERSION.md"}',
		file_write: '{"path": "tmp_test.txt", "content": "Hello World"}',
		agent_status: '{}',
		session_list: '{}',
	};

	const handleFormatJson = () => {
		try {
			const parsed = JSON.parse(toolArgs.trim() || "{}");
			setToolArgs(JSON.stringify(parsed, null, 2));
			setJsonValidationError(null);
			showFeedback("JSON formatted successfully", "info");
		} catch (err: any) {
			showFeedback(`Cannot format: ${err.message}`, "error");
		}
	};

	const handleResetTemplate = () => {
		const tpl = defaultTemplates[selectedTool] || "{}";
		setToolArgs(tpl);
		setJsonValidationError(null);
		showFeedback(`Reset template for '${selectedTool}'`, "info");
	};

	// MCP Tool Execution with strict validation, timeout, and distinct error states
	const handleRunTool = async () => {
		if (jsonValidationError) {
			showFeedback(`Cannot execute: ${jsonValidationError}`, "error");
			return;
		}
		let parsed = {};
		if (toolArgs.trim()) {
			try {
				parsed = JSON.parse(toolArgs);
			} catch (err: any) {
				setJsonValidationError(err.message);
				showFeedback(`Invalid JSON syntax: ${err.message}`, "error");
				return;
			}
		}

		setIsInvokingTool(true);
		setToolOutput("Invoking MCP tool, waiting for response...");

		// 15 second client-side safety timeout
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error("Tool invocation timed out after 15 seconds")), 15000);
		});

		try {
			const callPromise = api.mcpCallTool(selectedTool, parsed);
			const result: any = await Promise.race([callPromise, timeoutPromise]);
			setToolOutput(JSON.stringify(result, null, 2));
			if (result && result.error) {
				showFeedback(`Tool returned error: ${result.error}`, "error");
			} else {
				showFeedback(`Successfully executed tool: ${selectedTool}`, "success");
			}
			refreshStatus();
		} catch (err: any) {
			const errorMsg = err.message || String(err);
			setToolOutput(`Execution failed:\n${errorMsg}`);
			showFeedback(`Tool execution failed: ${errorMsg}`, "error");
		} finally {
			setIsInvokingTool(false);
		}
	};

	// Server Controls
	const handleRestartServers = async () => {
		try {
			await api.restartServers();
			showFeedback("Servers restarted successfully", "success");
			refreshStatus();
		} catch (err) {
			showFeedback(`Failed to restart servers: ${err}`, "error");
		}
	};

	const handleStopServers = async () => {
		try {
			await api.stopServers();
			showFeedback("Backend servers stopped", "info");
			refreshStatus();
		} catch (err) {
			showFeedback(`Error stopping servers: ${err}`, "error");
		}
	};

	const handleToggleTray = async () => {
		try {
			const enabled = await api.toggleSystemTray();
			onNotification(`System Tray ${enabled ? "enabled" : "hidden"}`);
			refreshStatus();
		} catch (err) {
			onNotification(`Error toggling tray: ${err}`);
		}
	};

	const handleQuitApp = async () => {
		if (confirm("Are you sure you want to stop all servers and quit TormentNexus?")) {
			await api.quitApp();
		}
	};

	// Quick config save
	const handleSaveQuickConfig = async () => {
		try {
			await api.setConfigValue("fontSize", Number(fontSize));
			await api.setConfigValue("fontFamily", fontFamily);
			await api.setConfigValue("cursorShape", cursorShape);
			onNotification("Preferences updated!");
		} catch (err) {
			onNotification(`Error saving config: ${err}`);
		}
	};

	const sessionList = Object.values(sessions);

	return (
		<div className="tn_dashboard_overlay">
			<div className="tn_dashboard_container">
				{/* Feedback Toast Notification */}
				{feedbackToast && (
					<div
						className={`tn_toast_banner ${
							feedbackToast.type === "error"
								? "tn_toast_error"
								: feedbackToast.type === "success"
								? "tn_toast_success"
								: "tn_toast_info"
						}`}
						role="alert"
					>
						<span>{feedbackToast.type === "error" ? "❌" : feedbackToast.type === "success" ? "✓" : "ℹ"}</span>
						<span>{feedbackToast.message}</span>
						<button
							onClick={() => setFeedbackToast(null)}
							className="tn_toast_close"
							aria-label="Dismiss notification"
						>
							✕
						</button>
					</div>
				)}

				{/* Top Bar / Header */}
				<div className="tn_dashboard_header">
					<div className="tn_dashboard_title_group">
						<span className="tn_dashboard_title">TormentNexus Mission Control</span>
						<span className="tn_version_badge">v{serverStatus.version || "1.1.0"}</span>
						<Tooltip text="Unified Mission Control brings together Autonomous Agent management, Model Context Protocol (MCP) tooling, terminal session controls, and server lifecycle in one singular high-value dashboard." />
					</div>
					<div className="tn_dashboard_actions">
						{!showOnboarding && (
							<button
								className="tn_btn tn_btn_secondary"
								onClick={() => setShowOnboarding(true)}
								style={{ marginRight: "8px" }}
								title="Show Quick-Start Onboarding Guide"
								aria-label="Show onboarding guide"
							>
								📖 Quick-Start Guide
							</button>
						)}
						<button
							className="tn_btn tn_btn_primary"
							onClick={onCloseDashboard}
							title="Return to full-screen terminal (Esc)"
							aria-label="Return to full-screen terminal"
						>
							Return to Terminal ⏎ <span style={{ opacity: 0.7, fontSize: "11px", marginLeft: "4px" }}>(Esc)</span>
						</button>
					</div>
				</div>

				{/* Quick-Start & Onboarding Guide Card */}
				{showOnboarding && (
					<div className="tn_onboarding_card" role="region" aria-label="Quick-Start Onboarding Guide">
						<div className="tn_onboarding_header">
							<div className="tn_onboarding_title">
								🚀 Welcome to TormentNexus — Quick-Start Onboarding Guide
								<Tooltip text="Follow these 3 simple steps to master autonomous agent operations and MCP tooling." />
							</div>
							<button
								className="tn_toast_close"
								onClick={() => {
									setShowOnboarding(false);
									showFeedback("Onboarding guide dismissed. Click '📖 Quick-Start Guide' in the header anytime to view again.", "info");
								}}
								aria-label="Dismiss onboarding guide"
								title="Dismiss guide"
							>
								✕ Dismiss
							</button>
						</div>
						<div className="tn_onboarding_steps">
							<div
								className={`tn_onboarding_step ${activeOnboardingStep === 1 ? "tn_onboarding_step_active" : ""}`}
								onClick={() => {
									setActiveOnboardingStep(1);
									setAgentCommand("scan_sessions");
									showFeedback("Step 1 Activated: Agent prompt pre-filled with 'scan_sessions'. Click Dispatch to run!", "info");
								}}
								style={{ cursor: "pointer" }}
								title="Click to activate Step 1"
							>
								<span className="tn_step_num">1</span>
								<div className="tn_step_text">
									<strong>Agent Presets:</strong> Click <code>⚡ Scan Sessions</code> or <code>⚙ Inspect Config</code> to trigger immediate Think-Act-Observe reasoning loops.
									<div className="tn_step_hint">👉 Click step to pre-fill prompt</div>
								</div>
							</div>
							<div
								className={`tn_onboarding_step ${activeOnboardingStep === 2 ? "tn_onboarding_step_active" : ""}`}
								onClick={() => {
									setActiveOnboardingStep(2);
									setSelectedTool("session_list");
									setToolArgs("{}");
									showFeedback("Step 2 Activated: 'session_list' tool selected and arguments initialized.", "info");
								}}
								style={{ cursor: "pointer" }}
								title="Click to activate Step 2"
							>
								<span className="tn_step_num">2</span>
								<div className="tn_step_text">
									<strong>MCP Tool Invocation:</strong> Click any tool card below to auto-populate arguments, then press <code>Ctrl+Enter</code> or click <strong>⚡ Run Tool</strong>.
									<div className="tn_step_hint">👉 Click step to select tool</div>
								</div>
							</div>
							<div
								className={`tn_onboarding_step ${activeOnboardingStep === 3 ? "tn_onboarding_step_active" : ""}`}
								onClick={() => {
									setActiveOnboardingStep(3);
									if (toolOutput) {
										setAgentCommand(`Analyze MCP tool result for '${selectedTool}': ${toolOutput.slice(0, 150)}`);
										showFeedback(`Piped '${selectedTool}' result into agent directive input!`, "success");
									} else {
										showFeedback("Step 3: Run any tool first to pipe results into the Autonomous Agent.", "info");
									}
								}}
								style={{ cursor: "pointer" }}
								title="Click to activate Step 3"
							>
								<span className="tn_step_num">3</span>
								<div className="tn_step_text">
									<strong>Autonomous Result Piping:</strong> Click <strong>🤖 Send to Agent Directive</strong> on tool results to instruct the AI agent to analyze the output.
									<div className="tn_step_hint">👉 Click step to pipe result</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* High-Value Telemetry Banner */}
				<div className="tn_telemetry_banner">
					<div className="tn_telemetry_card">
						<div className="tn_telemetry_label">
							Agent Harness
							<Tooltip text="Current execution status of the autonomous LLM agent harness loop." />
						</div>
						<div className="tn_telemetry_value">
							<span
								className={`tn_badge ${
									agentRunning ? "tn_badge_success" : "tn_badge_idle"
								}`}
							>
								{agentRunning ? "RUNNING" : "IDLE"}
							</span>
						</div>
					</div>

					<div className="tn_telemetry_card">
						<div className="tn_telemetry_label">
							MCP Hub Server
							<Tooltip text="Centralized Model Context Protocol hub listening for local and external tools." />
						</div>
						<div className="tn_telemetry_value">
							<span
								className={`tn_badge ${
									serverStatus.mcpServerRunning ? "tn_badge_success" : "tn_badge_danger"
								}`}
							>
								{serverStatus.mcpServerRunning
									? `PORT :${serverStatus.mcpServerPort}`
									: "OFFLINE"}
							</span>
						</div>
					</div>

					<div className="tn_telemetry_card">
						<div className="tn_telemetry_label">
							Active Tools
							<Tooltip text="Count of Model Context Protocol tools loaded and ready for autonomous invocation." />
						</div>
						<div className="tn_telemetry_value">
							<span className="tn_telemetry_number">
								{mcpTools.length || telemetry.active_tools || 5}
							</span>
						</div>
					</div>

					<div className="tn_telemetry_card">
						<div className="tn_telemetry_label">
							Active Terminals
							<Tooltip text="Number of concurrent PTY pseudo-terminal sessions open in Go core." />
						</div>
						<div className="tn_telemetry_value">
							<span className="tn_telemetry_number">{sessionList.length}</span>
						</div>
					</div>

					<div className="tn_telemetry_card">
						<div className="tn_telemetry_label">
							System Tray
							<Tooltip text="Status of the background system tray icon for rapid window toggle and shutdown." />
						</div>
						<div className="tn_telemetry_value">
							<span className="tn_badge tn_badge_info">
								{serverStatus.trayEnabled ? "ACTIVE" : "MINIMIZED"}
							</span>
						</div>
					</div>
				</div>

				{/* Consolidated Dashboard Grid (Single Page Architecture) */}
				<div className="tn_dashboard_grid">
					{/* SECTION 1: Autonomous Agent Control Panel with Reasoning Step Feed */}
					<div className="tn_dashboard_panel">
						<div className="tn_panel_header">
							<div className="tn_panel_title">
								🤖 Autonomous Agent Control Panel
								<Tooltip text="Manage autonomous agent loops, inspect Think-Act-Observe action logs, and execute commands." />
							</div>
							<div className="tn_panel_controls">
								{!agentRunning ? (
									<button
										className="tn_btn tn_btn_success"
										onClick={handleAgentStart}
										title="Start autonomous execution loop"
									>
										▶ Start Agent
									</button>
								) : (
									<button
										className="tn_btn tn_btn_danger"
										onClick={handleAgentStop}
										title="Stop autonomous execution loop"
									>
										⏹ Stop Agent
									</button>
								)}
								<button
									className="tn_btn tn_btn_secondary"
									onClick={handleAgentHealth}
									title="Run diagnostic health check on agent"
								>
									🩺 Health Check
								</button>
							</div>
						</div>

						<div className="tn_panel_body">
							{/* Quick Autonomous Workflow Presets */}
							<div className="tn_agent_presets_row">
								<span style={{ fontSize: "10px", color: "#888", display: "flex", alignItems: "center" }}>
									Presets:
								</span>
								<button
									className="tn_btn_preset"
									onClick={() => handleAgentExec("scan_sessions")}
									title="Dispatch directive to query active terminals"
								>
									⚡ Scan Sessions
								</button>
								<button
									className="tn_btn_preset"
									onClick={() => handleAgentExec("check_config")}
									title="Dispatch directive to inspect configuration"
								>
									⚙ Inspect Config
								</button>
								<button
									className="tn_btn_preset"
									onClick={() => handleAgentExec("status")}
									title="Query agent status"
								>
									📊 Query Status
								</button>
							</div>

							{/* Think-Act-Observe Step Feed */}
							<div className="tn_steps_container">
								{agentSteps.map((s) => (
									<div key={s.id} className="tn_step_item">
										<div className="tn_step_header">
											<span
												className={`tn_phase_badge ${
													s.phase === "PLAN"
														? "tn_phase_plan"
														: s.phase === "THINK"
														? "tn_phase_think"
														: s.phase === "ACT"
														? "tn_phase_act"
														: s.phase === "OBSERVE"
														? "tn_phase_observe"
														: "tn_phase_reflect"
												}`}
											>
												{s.phase}
											</span>
											{s.tool && (
												<span style={{ fontSize: "10px", color: "#64b5f6" }}>
													tool: {s.tool}
												</span>
											)}
											{s.durationMs > 0 && (
												<span style={{ fontSize: "9px", color: "#00bcd4" }}>
													{s.durationMs}ms
												</span>
											)}
										</div>
										<div className="tn_step_thought">{s.thought}</div>
										{s.result && (
											<div className="tn_step_result">{s.result}</div>
										)}
									</div>
								))}
							</div>

							<div className="tn_log_terminal" style={{ height: "80px" }}>
								{agentLogs.slice(-6).map((log, idx) => (
									<div key={idx} className="tn_log_entry">
										{log}
									</div>
								))}
							</div>

							{/* Multi-step Autonomous Task Queue */}
							{taskQueue.length > 0 && (
								<div className="tn_task_queue_box" style={{ marginBottom: "8px" }}>
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
										<span style={{ fontSize: "11px", fontWeight: "bold", color: "#64b5f6" }}>
											📋 Autonomous Task Queue ({taskQueue.length})
										</span>
										<button
											type="button"
											className="tn_btn tn_btn_small tn_btn_secondary"
											onClick={handleClearQueue}
											title="Clear all pending queued tasks"
										>
											Clear Queue
										</button>
									</div>
									<div className="tn_queue_items" style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
										{taskQueue.map((item, idx) => (
											<span key={idx} className="tn_queue_item_badge">
												#{idx + 1} {item}
											</span>
										))}
									</div>
								</div>
							)}

							<form
								onSubmit={(e) => {
									e.preventDefault();
									handleAgentExec();
								}}
								className="tn_agent_input_form"
								aria-label="Autonomous agent directive dispatch form"
							>
								<input
									type="text"
									className="tn_input tn_flex_1"
									placeholder="Dispatch directive to autonomous agent (e.g., scan_sessions, check_config)..."
									value={agentCommand}
									onChange={(e) => setAgentCommand(e.target.value)}
									aria-label="Agent directive command"
								/>
								<button type="submit" className="tn_btn tn_btn_primary" aria-label="Dispatch directive">
									Dispatch ⏎
								</button>
								<button
									type="button"
									className="tn_btn tn_btn_secondary"
									onClick={handleQueueTask}
									title="Add directive to autonomous task queue"
									aria-label="Queue task"
								>
									+ Queue
								</button>
							</form>
							<div style={{ fontSize: "10px", color: "#666", marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
								<span>💡 Tip: Press Enter to dispatch immediately, or click + Queue for sequential autonomous execution.</span>
								<span>Autopilot Mode: {agentRunning ? "ACTIVE" : "STANDBY"}</span>
							</div>
						</div>
					</div>

					{/* SECTION 2: Model Context Protocol (MCP) Hub & Tool Runner with Real-Time Performance Monitor */}
					<div className="tn_dashboard_panel">
						<div className="tn_panel_header">
							<div className="tn_panel_title">
								🔌 Model Context Protocol (MCP) Tool Monitor
								<Tooltip text="Real-time tool performance monitoring, latency tracking, status codes, and execution harness." />
							</div>
							<span className="tn_panel_badge">
								{mcpTools.length} Tools Loaded
							</span>
						</div>

						<div className="tn_panel_body">
							{/* Real-time Tool Performance Cards */}
							<div className="tn_tool_metrics_grid">
								{mcpTools.map((t) => {
									const toolName = t.Name || t.name;
									const records = executionHistory.filter((h) => h.tool === toolName);
									const latest = records[records.length - 1];
									const avgLatency =
										records.length > 0
											? Math.round(
													records.reduce((acc, cur) => acc + cur.durationMs, 0) /
														records.length,
											  )
											: null;

									const defaultTemplates: Record<string, string> = {
										shell_execute: '{"command": "echo Hello from TormentNexus"}',
										file_read: '{"path": "VERSION.md"}',
										file_write: '{"path": "tmp_test.txt", "content": "Hello World"}',
										agent_status: '{}',
										session_list: '{}',
									};

									const handleSelect = () => {
										setSelectedTool(toolName);
										if (defaultTemplates[toolName]) {
											setToolArgs(defaultTemplates[toolName]);
										} else {
											setToolArgs('{}');
										}
										showFeedback(`Selected tool: ${toolName}`, "info");
									};

									return (
										<div
											key={toolName}
											className={`tn_tool_card ${
												toolName === selectedTool ? "tn_session_active" : ""
											}`}
											onClick={handleSelect}
											style={{ cursor: "pointer" }}
											role="button"
											tabIndex={0}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													handleSelect();
												}
											}}
											aria-label={`Select tool ${toolName}`}
										>
											<div className="tn_tool_card_top">
												<span className="tn_tool_name" title={toolName}>
													{toolName}
												</span>
												<span
													className={`tn_tool_status_pill ${
														latest
															? latest.statusCode === 200
																? "tn_status_ok"
																: "tn_status_err"
															: "tn_status_idle"
													}`}
												>
													{latest ? `${latest.statusCode} OK` : "READY"}
												</span>
											</div>
											<div className="tn_tool_card_bottom">
												<span>Avg: {avgLatency !== null ? `${avgLatency}ms` : "<1ms"}</span>
												<span className="tn_latency_badge">
													{latest ? `${latest.durationMs}ms` : "idle"}
												</span>
											</div>
											{/* Small latency bar graph */}
											<div className="tn_exec_graph_container">
												{(records.length > 0 ? records.slice(-8) : [1, 2, 3]).map(
													(rec: any, idx) => (
														<div
															key={idx}
															className={`tn_exec_graph_bar ${
																rec.statusCode && rec.statusCode !== 200 ? "err" : ""
															}`}
															style={{
																height: `${Math.min(
																	100,
																	Math.max(25, (rec.durationMs || 10) * 3),
																)}%`,
															}}
														/>
													),
												)}
											</div>
										</div>
									);
								})}
							</div>

							<div className="tn_form_group" style={{ marginTop: "10px" }}>
								<label className="tn_label">
									Selected Tool: <strong style={{ color: "#fff", marginLeft: "4px" }}>{selectedTool}</strong>
									<Tooltip text="Selected tool for manual execution and testing." />
								</label>
							</div>

							<div className="tn_form_group">
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
									<label className="tn_label" style={{ margin: 0 }}>
										Arguments (JSON):
										<Tooltip text="JSON payload conforming to the tool's input schema. Press Ctrl+Enter to execute." />
									</label>
									<div style={{ display: "flex", gap: "6px" }}>
										<button
											type="button"
											className="tn_btn tn_btn_small tn_btn_secondary"
											onClick={handleFormatJson}
											title="Format JSON payload with indentation"
											aria-label="Format JSON"
										>
											✨ Format JSON
										</button>
										<button
											type="button"
											className="tn_btn tn_btn_small tn_btn_secondary"
											onClick={handleResetTemplate}
											title="Reset arguments to default template for this tool"
											aria-label="Reset Template"
										>
											↺ Reset Template
										</button>
									</div>
								</div>
								<textarea
									className={`tn_textarea ${jsonValidationError ? "tn_textarea_error" : ""}`}
									rows={3}
									value={toolArgs}
									onChange={(e) => setToolArgs(e.target.value)}
									onKeyDown={(e) => {
										if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
											e.preventDefault();
											handleRunTool();
										}
									}}
									aria-label="Tool Arguments JSON"
									aria-invalid={jsonValidationError ? "true" : "false"}
								/>
								{jsonValidationError && (
									<div className="tn_validation_error_box" role="alert">
										<span className="tn_error_icon">⚠️</span>
										<span className="tn_error_text">JSON Syntax Error: {jsonValidationError}</span>
									</div>
								)}
							</div>

							<div className="tn_btn_group">
								<button
									className={`tn_btn tn_btn_primary ${jsonValidationError || isInvokingTool ? "tn_btn_disabled" : ""}`}
									onClick={handleRunTool}
									disabled={!!jsonValidationError || isInvokingTool}
									title={jsonValidationError ? "Fix JSON syntax error to run" : "Invoke tool via MCP backend (Ctrl+Enter)"}
									aria-label="Run MCP Tool"
								>
									{isInvokingTool ? "⏳ Invoking..." : "⚡ Run Tool"} <span style={{ opacity: 0.7, fontSize: "11px", marginLeft: "4px" }}>(Ctrl+Enter)</span>
								</button>
							</div>

							{toolOutput && (
								<div className="tn_tool_output">
									<div className="tn_output_header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
										<span>Invocation Result:</span>
										<button
											className="tn_btn tn_btn_small tn_btn_secondary"
											onClick={() => {
												setAgentCommand(`Analyze MCP tool result for '${selectedTool}': ${toolOutput.slice(0, 150)}`);
												showFeedback("Piped tool result to Agent directive input", "info");
											}}
											title="Pipe this output into autonomous agent directive input"
											aria-label="Send result to autonomous agent"
										>
											🤖 Send to Agent Directive
										</button>
									</div>
									<pre className="tn_output_pre">{toolOutput}</pre>
								</div>
							)}
						</div>
					</div>

					{/* SECTION 3: Terminal Session Orchestration */}
					<div className="tn_dashboard_panel">
						<div className="tn_panel_header">
							<div className="tn_panel_title">
								💻 Terminal Session Orchestration
								<Tooltip text="Inspect and manage all concurrent Go core PTY sessions." />
							</div>
							<button
								className="tn_btn tn_btn_secondary"
								onClick={onNewSession}
								title="Create a new terminal tab"
							>
								+ New Session
							</button>
						</div>

						<div className="tn_panel_body">
							<div className="tn_session_list">
								{sessionList.map((s) => (
									<div
										key={s.uid}
										className={`tn_session_row ${
											s.uid === activeSessionId ? "tn_session_active" : ""
										}`}
									>
										<div className="tn_session_info">
											<span className="tn_session_name">{s.title || "Shell"}</span>
											<span className="tn_session_pid">PID: {s.pid}</span>
											<span className="tn_session_shell">{s.shell}</span>
										</div>
										<div className="tn_session_actions">
											<button
												className="tn_btn tn_btn_small tn_btn_primary"
												onClick={() => {
													onSelectSession(s.uid);
													onCloseDashboard();
												}}
												title="Switch to this terminal and view"
											>
												Focus
											</button>
											{sessionList.length > 1 && (
												<button
													className="tn_btn tn_btn_small tn_btn_danger"
													onClick={() => onCloseSession(s.uid)}
													title="Terminate this terminal process"
												>
													Terminate
												</button>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* SECTION 4: Server Lifecycle & System Tray Management */}
					<div className="tn_dashboard_panel">
						<div className="tn_panel_header">
							<div className="tn_panel_title">
								⚙️ Server Lifecycle & System Controls
								<Tooltip text="Restart or stop backend HTTP and Agent servers, control tray behavior, and safely quit." />
							</div>
						</div>

						<div className="tn_panel_body">
							<div className="tn_control_grid">
								<div className="tn_control_card">
									<div className="tn_control_card_title">
										Restart Servers
										<Tooltip text="Restarts the MCP HTTP server on :8080 and resets listeners." />
									</div>
									<button
										className="tn_btn tn_btn_secondary tn_w_full"
										onClick={handleRestartServers}
									>
										🔄 Restart MCP (:8080)
									</button>
								</div>

								<div className="tn_control_card">
									<div className="tn_control_card_title">
										Stop All Servers
										<Tooltip text="Gracefully shuts down the MCP HTTP server and stops background agent loops." />
									</div>
									<button
										className="tn_btn tn_btn_danger tn_w_full"
										onClick={handleStopServers}
									>
										🛑 Stop Servers
									</button>
								</div>

								<div className="tn_control_card">
									<div className="tn_control_card_title">
										System Tray Icon
										<Tooltip text="Toggles the system tray icon presence and minimized desktop behavior." />
									</div>
									<button
										className="tn_btn tn_btn_secondary tn_w_full"
										onClick={handleToggleTray}
									>
										🔔 Toggle Tray Icon
									</button>
								</div>

								<div className="tn_control_card">
									<div className="tn_control_card_title">
										Full Application Exit
										<Tooltip text="Gracefully kills all sessions, stops servers, and terminates TormentNexus." />
									</div>
									<button
										className="tn_btn tn_btn_danger tn_w_full"
										onClick={handleQuitApp}
									>
										✕ Clean Shutdown & Exit
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* SECTION 5: Quick Settings & Preferences */}
					<div className="tn_dashboard_panel tn_panel_full">
						<div className="tn_panel_header">
							<div className="tn_panel_title">
								🛠️ Rapid Configuration & Ergonomics
								<Tooltip text="Quickly adjust fonts, cursor styles, and environment defaults without manual JSON editing." />
							</div>
							<button
								className="tn_btn tn_btn_primary"
								onClick={handleSaveQuickConfig}
								title="Save settings to configuration"
							>
								💾 Apply Settings
							</button>
						</div>

						<div className="tn_panel_body tn_row_controls">
							<div className="tn_form_group tn_flex_1">
								<label className="tn_label">
									Font Size (px):
									<Tooltip text="Terminal font size in points." />
								</label>
								<input
									type="number"
									className="tn_input"
									value={fontSize}
									onChange={(e) => setFontSize(Number(e.target.value))}
								/>
							</div>

							<div className="tn_form_group tn_flex_1">
								<label className="tn_label">
									Font Family:
									<Tooltip text="Font family string used by terminal renderer." />
								</label>
								<input
									type="text"
									className="tn_input"
									value={fontFamily}
									onChange={(e) => setFontFamily(e.target.value)}
								/>
							</div>

							<div className="tn_form_group tn_flex_1">
								<label className="tn_label">
									Cursor Shape:
									<Tooltip text="Visual shape of cursor in active terminals." />
								</label>
								<select
									className="tn_select"
									value={cursorShape}
									onChange={(e) => setCursorShape(e.target.value)}
								>
									<option value="BLOCK">BLOCK</option>
									<option value="BEAM">BEAM</option>
									<option value="UNDERLINE">UNDERLINE</option>
								</select>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
