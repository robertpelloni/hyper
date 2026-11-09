import React, { useState, useEffect, useCallback } from "react";
import type { AppConfig, SessionInfo, ServerStatus, MCPTool, MCPTelemetry, ToolExecutionRecord, AgentExecutionStep, TerminalBlock, PluginInfo } from "../types";
import * as api from "../api";
import Tooltip from "./Tooltip";

// Structured multi-step automation workflow templates for the Autonomous Agent
export interface WorkflowTemplate {
	id: string;
	name: string;
	desc: string;
	category: "Audit" | "Security" | "Diagnostics" | "Indexing";
	directives: string[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
	{
		id: "audit",
		name: "Code & Session Health Audit",
		desc: "Runs git status check, scans active terminal sessions, and verifies system status",
		category: "Audit",
		directives: ["git_status", "scan_sessions", "system_info"],
	},
	{
		id: "security",
		name: "Security & Permissions Sweep",
		desc: "Executes shell permission checks, audits active PTY sessions, and checks workspace config",
		category: "Security",
		directives: ["shell_execute: ls -la", "scan_sessions", "check_config"],
	},
	{
		id: "mcp_diag",
		name: "MCP Aggregator & Tool Diagnostic",
		desc: "Tests system info, lists available MCP tools, and runs an agent status health check",
		category: "Diagnostics",
		directives: ["system_info", "agent_status", "scan_sessions"],
	},
	{
		id: "indexing",
		name: "Full Workspace Re-indexing",
		desc: "Searches workspace files for configuration and documentation entry points",
		category: "Indexing",
		directives: ["workspace_search: config", "workspace_search: agent", "git_status"],
	},
];

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
	const [selectedWorkflowId, setSelectedWorkflowId] = useState("audit");
	const [agentLogs, setAgentLogs] = useState<string[]>([
		"Agent Harness initialized in idle state.",
	]);
	const [agentRunning, setAgentRunning] = useState(false);
	const [agentSteps, setAgentSteps] = useState<AgentExecutionStep[]>([]);
	const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>("ALL");
	const [taskQueue, setTaskQueue] = useState<string[]>([]);

	const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
	const [selectedTool, setSelectedTool] = useState<string>("shell_execute");
	const [toolArgs, setToolArgs] = useState('{"command": "echo Hello from TormentNexus"}');
	const [toolOutput, setToolOutput] = useState<string>("");
	const [toolErrorState, setToolErrorState] = useState<{ isError: boolean; errorCode?: string; message?: string; remediation?: string } | null>(null);
	const [toolRetryCount, setToolRetryCount] = useState<number>(0);
	const [lastExecutionDuration, setLastExecutionDuration] = useState<number | null>(null);
	const [executionHistory, setExecutionHistory] = useState<ToolExecutionRecord[]>([]);
	const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);
	const [isInvokingTool, setIsInvokingTool] = useState<boolean>(false);

	// Tool filtering, category & status tabs in MCP Monitor
	const [toolSearchQuery, setToolSearchQuery] = useState<string>("");
	const [toolStatusFilter, setToolStatusFilter] = useState<"all" | "success" | "error">("all");
	const [toolCategoryFilter, setToolCategoryFilter] = useState<string>("ALL");

	const [telemetry, setTelemetry] = useState<MCPTelemetry>({
		status: "active",
		active_tools: 0,
		servers: 1,
		version: "1.1.0",
	});

	// Terminal Command Blocks State (Warp-style)
	const [commandBlocks, setCommandBlocks] = useState<TerminalBlock[]>([]);
	const [blockSearchQuery, setBlockSearchQuery] = useState<string>("");
	const [blockStatusFilter, setBlockStatusFilter] = useState<"all" | "success" | "failed">("all");

	// Active Terminal Session Output Preview State
	const [sessionTailOutput, setSessionTailOutput] = useState<string>("");
	const [showSessionOutputPreview, setShowSessionOutputPreview] = useState<boolean>(true);
	const [sessionTailLines, setSessionTailLines] = useState<number>(10);

	// Quick Settings state
	const [fontSize, setFontSize] = useState<number>(config.fontSize || 12);
	const [fontFamily, setFontFamily] = useState<string>(config.fontFamily || "monospace");
	const [cursorShape, setCursorShape] = useState<string>(config.cursorShape || "BLOCK");

	// Terminal Plugins & Extensions State
	const [pluginsList, setPluginsList] = useState<PluginInfo[]>([]);
	const [pluginFilter, setPluginFilter] = useState<string>("ALL");

	// Remote SSH Session Modal State
	const [showSSHModal, setShowSSHModal] = useState<boolean>(false);
	const [sshHost, setSshHost] = useState<string>("");
	const [sshPort, setSshPort] = useState<number>(22);
	const [sshUser, setSshUser] = useState<string>("root");
	const [sshPassword, setSshPassword] = useState<string>("");

	// Onboarding Guide banner visibility & progress tracking
	const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
	const [activeOnboardingStep, setActiveOnboardingStep] = useState<number | null>(null);
	const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

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

			const blocks = await api.getTerminalHistory();
			if (blocks) {
				setCommandBlocks(blocks);
			}

			const plugins = await api.getRecommendedPlugins();
			if (plugins) {
				setPluginsList(plugins);
			}

			if (activeSessionId) {
				const tail = await api.getSessionOutput(activeSessionId, sessionTailLines);
				if (tail) {
					setSessionTailOutput(tail);
				}
			}
		} catch (err) {
			console.warn("Failed to refresh status:", err);
		}
	}, [activeSessionId, sessionTailLines]);

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

	const handleLoadWorkflowTemplate = async (mode: "queue" | "pipeline") => {
		const template = WORKFLOW_TEMPLATES.find((t) => t.id === selectedWorkflowId);
		if (!template) return;

		if (mode === "pipeline") {
			const chained = template.directives.join(" && ");
			setAgentCommand(chained);
			showFeedback(`Loaded "${template.name}" as pipeline into directive input`, "info");
		} else {
			try {
				for (const directive of template.directives) {
					await api.agentQueueTask(directive);
				}
				showFeedback(`Enqueued ${template.directives.length} tasks from "${template.name}"`, "success");
				refreshStatus();
			} catch (err: any) {
				showFeedback(`Failed to queue workflow: ${err.message || err}`, "error");
			}
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

		const callStart = Date.now();
		try {
			const callPromise = api.mcpCallTool(selectedTool, parsed);
			const result: any = await Promise.race([callPromise, timeoutPromise]);
			const duration = Date.now() - callStart;
			setLastExecutionDuration(result?.durationMs ?? duration);
			const resStr = JSON.stringify(result, null, 2);
			setToolOutput(resStr);
			if (result && (result.error || result.status === "error" || result.statusCode >= 400)) {
				const code = result.errorCode || (result.statusCode ? `HTTP_${result.statusCode}` : "EXECUTION_ERROR");
				const msg = result.error || result.message || "Tool execution failed";
				const remediation = result.remediation || "Check input schema and parameters, then retry";
				setToolErrorState({ isError: true, errorCode: code, message: msg, remediation });
				setToolRetryCount(prev => prev + 1);
				showFeedback(`Tool returned error [${code}]: ${msg}`, "error");
			} else {
				setToolErrorState(null);
				setToolRetryCount(0);
				showFeedback(`Successfully executed tool: ${selectedTool}`, "success");
			}
			refreshStatus();
		} catch (err: any) {
			const duration = Date.now() - callStart;
			setLastExecutionDuration(duration);
			const errorMsg = err.message || String(err);
			setToolOutput(`Execution failed:\n${errorMsg}`);
			setToolErrorState({
				isError: true,
				errorCode: "INVOCATION_EXCEPTION",
				message: errorMsg,
				remediation: "Verify MCP daemon status or network connection and retry",
			});
			setToolRetryCount(prev => prev + 1);
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
								<span style={{ fontSize: "11px", fontWeight: "bold", marginLeft: "10px", color: "#64b5f6", background: "rgba(100, 181, 246, 0.15)", padding: "2px 8px", borderRadius: "10px" }}>
									{Object.values(completedSteps).filter(Boolean).length}/5 Completed
								</span>
								<Tooltip text="Follow these 5 simple steps to master autonomous agent operations, MCP tooling, terminal blocks, snapshots, and plugins." />
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
									setCompletedSteps(prev => ({ ...prev, 1: true }));
									setAgentCommand("git_status && system_info");
									showFeedback("Step 1 Activated: Agent prompt pre-filled with pipeline 'git_status && system_info'. Press Dispatch to run!", "info");
								}}
								style={{ cursor: "pointer" }}
								title="Click to activate Step 1"
							>
								<span className="tn_step_num">{completedSteps[1] ? "✓" : "1"}</span>
								<div className="tn_step_text">
									<strong>Agent Pipelines:</strong> Click presets like <code>🔗 Pipeline: Audit</code> or <code>⚡ Scan Sessions</code> to run Think-Act-Observe reasoning loops.
									<div className="tn_step_hint">👉 Click to pre-fill pipeline</div>
								</div>
							</div>
							<div
								className={`tn_onboarding_step ${activeOnboardingStep === 2 ? "tn_onboarding_step_active" : ""}`}
								onClick={() => {
									setActiveOnboardingStep(2);
									setCompletedSteps(prev => ({ ...prev, 2: true }));
									setSelectedTool("session_list");
									setToolArgs("{}");
									showFeedback("Step 2 Activated: 'session_list' tool selected and arguments initialized.", "info");
								}}
								style={{ cursor: "pointer" }}
								title="Click to activate Step 2"
							>
								<span className="tn_step_num">{completedSteps[2] ? "✓" : "2"}</span>
								<div className="tn_step_text">
									<strong>MCP Tool Invocation:</strong> Click any tool card below to auto-populate arguments, then press <code>Ctrl+Enter</code> or click <strong>⚡ Run Tool</strong>.
									<div className="tn_step_hint">👉 Click to select tool</div>
								</div>
							</div>
							<div
								className={`tn_onboarding_step ${activeOnboardingStep === 3 ? "tn_onboarding_step_active" : ""}`}
								onClick={() => {
									setActiveOnboardingStep(3);
									setCompletedSteps(prev => ({ ...prev, 3: true }));
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
								<span className="tn_step_num">{completedSteps[3] ? "✓" : "3"}</span>
								<div className="tn_step_text">
									<strong>Autonomous Result Piping:</strong> Click <strong>🤖 Send to Agent Directive</strong> on tool results to instruct the AI agent to analyze output.
									<div className="tn_step_hint">👉 Click to pipe result</div>
								</div>
							</div>
							<div
								className={`tn_onboarding_step ${activeOnboardingStep === 4 ? "tn_onboarding_step_active" : ""}`}
								onClick={async () => {
									setActiveOnboardingStep(4);
									setCompletedSteps(prev => ({ ...prev, 4: true }));
									showFeedback("Step 4 Activated: Use '💾 Snapshot Sessions' or click '🤖 Explain & Fix' on command blocks to debug errors.", "info");
								}}
								style={{ cursor: "pointer" }}
								title="Click to activate Step 4"
							>
								<span className="tn_step_num">{completedSteps[4] ? "✓" : "4"}</span>
								<div className="tn_step_text">
									<strong>Blocks & Snapshots:</strong> Inspect Warp-style command blocks, export state, or click <code>💾 Snapshot Sessions</code> in Section 3.
									<div className="tn_step_hint">👉 Click to explore blocks</div>
								</div>
							</div>
							<div
								className={`tn_onboarding_step ${activeOnboardingStep === 5 ? "tn_onboarding_step_active" : ""}`}
								onClick={() => {
									setActiveOnboardingStep(5);
									setCompletedSteps(prev => ({ ...prev, 5: true }));
									showFeedback("Step 5 Activated: Explore popular terminal plugins below in 'Plugins & Themes Hub' to customize themes and workflows.", "info");
								}}
								style={{ cursor: "pointer" }}
								title="Click to activate Step 5"
							>
								<span className="tn_step_num">{completedSteps[5] ? "✓" : "5"}</span>
								<div className="tn_step_text">
									<strong>Plugin Personalization:</strong> Enable curated themes and tools like <code>hyper-snazzy</code> or <code>hypercwd</code> in the Plugins Hub below.
									<div className="tn_step_hint">👉 Click to explore plugins</div>
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
								<span className={`tn_agent_badge ${agentRunning ? "running" : "idle"}`}>
									{agentRunning ? "● RUNNING" : "○ IDLE"}
								</span>
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
								<button
									className="tn_btn_preset"
									onClick={() => handleAgentExec("git_status")}
									title="Dispatch directive to query Git repository status"
								>
									🌿 Git Status
								</button>
								<button
									className="tn_btn_preset"
									onClick={() => handleAgentExec("workspace_search:main")}
									title="Dispatch directive to search workspace for 'main'"
								>
									🔍 Find 'main'
								</button>
								<button
									className="tn_btn_preset"
									onClick={() => handleAgentExec("git_status && system_info")}
									title="Dispatch multi-step pipeline: git_status then system_info"
									style={{ borderColor: "#00e676", color: "#00e676" }}
								>
									🔗 Pipeline: Audit
								</button>
							</div>

							{/* Phase Filter Tabs & History Export */}
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
								<div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
									<span style={{ fontSize: "10px", color: "#888" }}>Phase:</span>
									{["ALL", "PLAN", "THINK", "ACT", "OBSERVE", "REFLECT"].map((phase) => (
										<button
											key={phase}
											type="button"
											className={`tn_btn tn_btn_small ${selectedPhaseFilter === phase ? "tn_btn_primary" : "tn_btn_secondary"}`}
											onClick={() => setSelectedPhaseFilter(phase)}
											style={{ fontSize: "9px", padding: "2px 6px" }}
										>
											{phase}
										</button>
									))}
								</div>
								<button
									type="button"
									className="tn_btn tn_btn_small tn_btn_secondary"
									style={{ fontSize: "9px", padding: "2px 8px" }}
									onClick={() => {
										const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(agentSteps, null, 2));
										const downloadAnchor = document.createElement("a");
										downloadAnchor.setAttribute("href", dataStr);
										downloadAnchor.setAttribute("download", `tormentnexus_agent_steps_${Date.now()}.json`);
										document.body.appendChild(downloadAnchor);
										downloadAnchor.click();
										downloadAnchor.remove();
										showFeedback(`Exported ${agentSteps.length} agent reasoning steps`, "success");
									}}
									title="Export agent reasoning history as JSON"
								>
									💾 Export Steps
								</button>
							</div>

							{/* Think-Act-Observe Step Feed */}
							<div className="tn_steps_container">
								{agentSteps
									.filter((s) => selectedPhaseFilter === "ALL" || s.phase === selectedPhaseFilter)
									.map((s) => (
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
												{s.tool && (s.phase === "ACT" || s.phase === "THINK") && (
													<div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
														<button
															type="button"
															className="tn_btn tn_btn_small tn_btn_secondary"
															style={{ fontSize: "8px", padding: "1px 4px", borderColor: "#34d399", color: "#34d399" }}
															onClick={(e) => {
																e.stopPropagation();
																handleAgentExec(s.tool);
																showFeedback(`Re-dispatched step tool '${s.tool}'!`, "success");
															}}
															title="Re-run this directive step immediately"
														>
															🔄 Re-run
														</button>
														<button
															type="button"
															className="tn_btn tn_btn_small tn_btn_secondary"
															style={{ fontSize: "8px", padding: "1px 4px", borderColor: "#64b5f6", color: "#64b5f6" }}
															onClick={(e) => {
																e.stopPropagation();
																setSelectedTool(s.tool);
																showFeedback(`Loaded tool '${s.tool}' into MCP runner`, "info");
															}}
															title="Load this tool into the MCP Runner for manual inspection"
														>
															🔧 Inspect Tool
														</button>
													</div>
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

							{/* Workflow Templates & Quick Automation Presets */}
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									padding: "6px 8px",
									background: "rgba(255, 255, 255, 0.03)",
									borderRadius: "4px",
									border: "1px solid #2a2a2a",
									marginBottom: "8px",
									fontSize: "11px",
								}}
							>
								<span style={{ fontWeight: "bold", color: "#81c784", whiteSpace: "nowrap" }}>
									⚡ Workflows:
								</span>
								<select
									className="tn_select"
									style={{ flex: 1, padding: "2px 6px", fontSize: "11px", height: "24px" }}
									value={selectedWorkflowId}
									onChange={(e) => setSelectedWorkflowId(e.target.value)}
									title="Select a predefined autonomous agent workflow template"
									aria-label="Workflow Template Selector"
								>
									{WORKFLOW_TEMPLATES.map((w) => (
										<option key={w.id} value={w.id}>
											[{w.category}] {w.name} ({w.directives.length} steps)
										</option>
									))}
								</select>
								<button
									type="button"
									className="tn_btn tn_btn_small tn_btn_primary"
									style={{ fontSize: "10px", padding: "2px 8px" }}
									onClick={() => handleLoadWorkflowTemplate("queue")}
									title="Enqueue all steps from this workflow into the autonomous task queue"
								>
									+ Queue All
								</button>
								<button
									type="button"
									className="tn_btn tn_btn_small tn_btn_secondary"
									style={{ fontSize: "10px", padding: "2px 8px" }}
									onClick={() => handleLoadWorkflowTemplate("pipeline")}
									title="Load as chained pipeline (&&) into the directive command input"
								>
									Load Pipeline
								</button>
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
												<span>#{idx + 1} {item}</span>
												<button
													type="button"
													className="tn_queue_item_del"
													onClick={async (e) => {
														e.stopPropagation();
														const updated = await api.agentRemoveTask(idx);
														setTaskQueue(updated);
														showFeedback(`Removed task #${idx + 1}`, "info");
													}}
													title={`Remove task #${idx + 1}`}
												>
													✕
												</button>
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
								<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
									<button
										type="button"
										className="tn_btn tn_btn_small tn_btn_secondary"
										onClick={async () => {
											await api.mcpClearToolExecutionHistory();
											setExecutionHistory([]);
											showFeedback("Cleared MCP tool execution metrics & history", "info");
										}}
										style={{ fontSize: "9px", padding: "1px 6px" }}
										title="Clear all recorded tool execution metrics and latency history"
									>
										Clear History
									</button>
									<span className="tn_panel_badge">
										{mcpTools.length} Tools Loaded
									</span>
								</div>
						</div>

						<div className="tn_panel_body">
							{/* Search, Categories & Filter Toolbar */}
							<div className="tn_mcp_filter_bar" style={{ flexDirection: "column", gap: "8px" }}>
								<div style={{ display: "flex", gap: "8px", width: "100%", alignItems: "center" }}>
									<input
										type="text"
										className="tn_filter_input"
										placeholder="Search tools..."
										value={toolSearchQuery}
										onChange={(e) => setToolSearchQuery(e.target.value)}
										style={{ flex: 1 }}
									/>
									<div className="tn_filter_tabs">
										<button
											type="button"
											className={`tn_filter_tab ${toolStatusFilter === "all" ? "active" : ""}`}
											onClick={() => setToolStatusFilter("all")}
										>
											All ({mcpTools.length})
										</button>
										<button
											type="button"
											className={`tn_filter_tab ${toolStatusFilter === "success" ? "active" : ""}`}
											onClick={() => setToolStatusFilter("success")}
										>
											Success
										</button>
										<button
											type="button"
											className={`tn_filter_tab ${toolStatusFilter === "error" ? "active" : ""}`}
											onClick={() => setToolStatusFilter("error")}
										>
											Error
										</button>
									</div>
								</div>
								{/* Category Pills with Dynamic Tool Counts */}
								<div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
									<span style={{ fontSize: "10px", color: "#888" }}>Category:</span>
									{["ALL", "System", "Filesystem", "Agent", "Intelligence"].map((cat) => {
										const count = cat === "ALL"
											? mcpTools.length
											: mcpTools.filter((t) => {
													const toolCat = (t as any).Category || (t as any).category || "System";
													return toolCat.toLowerCase() === cat.toLowerCase();
											  }).length;

										return (
											<button
												key={cat}
												type="button"
												className={`tn_btn tn_btn_small ${toolCategoryFilter === cat ? "tn_btn_primary" : "tn_btn_secondary"}`}
												onClick={() => setToolCategoryFilter(cat)}
												style={{ fontSize: "9px", padding: "1px 6px", display: "inline-flex", alignItems: "center", gap: "4px" }}
											>
												<span>{cat}</span>
												<span style={{
													fontSize: "8px",
													padding: "0 4px",
													borderRadius: "8px",
													background: toolCategoryFilter === cat ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
													color: toolCategoryFilter === cat ? "#fff" : "#94a3b8",
												}}>
													{count}
												</span>
											</button>
										);
									})}
								</div>
							</div>

							{/* Real-time Tool Performance Cards */}
							<div className="tn_tool_metrics_grid">
								{(() => {
									const filteredTools = mcpTools.filter((t) => {
										const toolName = (t.Name || t.name).toLowerCase();
										if (toolSearchQuery && !toolName.includes(toolSearchQuery.toLowerCase())) {
											return false;
										}
										if (toolStatusFilter !== "all") {
											const records = executionHistory.filter((h) => h.tool === (t.Name || t.name));
											const latest = records[records.length - 1];
											if (toolStatusFilter === "success") {
												return latest ? latest.status === "success" : true;
											}
											if (toolStatusFilter === "error") {
												return latest ? latest.status === "error" : false;
											}
										}
										if (toolCategoryFilter !== "ALL") {
											const cat = (t as any).Category || (t as any).category || "System";
											if (cat.toLowerCase() !== toolCategoryFilter.toLowerCase()) {
												return false;
											}
										}
										return true;
									});

									if (filteredTools.length === 0) {
										return (
											<div style={{
												gridColumn: "1 / -1",
												textAlign: "center",
												padding: "24px 16px",
												background: "rgba(0, 0, 0, 0.25)",
												borderRadius: "6px",
												border: "1px dashed rgba(255, 255, 255, 0.12)",
												color: "#94a3b8",
												fontSize: "12px",
											}}>
												<div style={{ fontSize: "18px", marginBottom: "6px" }}>🔍</div>
												<div>No MCP tools found matching query "<strong>{toolSearchQuery || toolCategoryFilter}</strong>".</div>
												<button
													type="button"
													className="tn_btn tn_btn_small tn_btn_secondary"
													style={{ marginTop: "10px", fontSize: "10px" }}
													onClick={() => {
														setToolSearchQuery("");
														setToolStatusFilter("all");
														setToolCategoryFilter("ALL");
													}}
												>
													↺ Reset Filters
												</button>
											</div>
										);
									}

									return filteredTools.map((t) => {
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
										config_get: '{"key": "fontSize"}',
										workspace_search: '{"query": "TormentNexus"}',
										git_status: '{}',
										system_info: '{}',
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
												<span
													className="tn_latency_badge"
													style={{
														color: latest
															? latest.durationMs < 25
																? "#4ade80"
																: latest.durationMs < 100
																? "#38bdf8"
																: latest.durationMs < 250
																? "#fbbf24"
																: "#f87171"
															: "#94a3b8",
														borderColor: latest
															? latest.durationMs < 25
																? "rgba(74, 222, 128, 0.3)"
																: latest.durationMs < 100
																? "rgba(56, 189, 248, 0.3)"
																: latest.durationMs < 250
																? "rgba(251, 191, 36, 0.3)"
																: "rgba(248, 113, 113, 0.3)"
															: "rgba(255, 255, 255, 0.1)",
													}}
													title={latest ? `Last call duration: ${latest.durationMs}ms` : "No calls recorded yet"}
												>
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

											{/* Streamlined Quick Pipe to Agent Directive */}
											<div style={{ marginTop: "6px", display: "flex", justifyContent: "flex-end" }}>
												<button
													type="button"
													className="tn_btn tn_btn_small tn_btn_secondary"
													style={{ fontSize: "9px", padding: "2px 6px", borderColor: "#7c4dff", color: "#b388ff" }}
													onClick={(e) => {
														e.stopPropagation();
														handleAgentExec(toolName);
														showFeedback(`Dispatched directive '${toolName}' to agent!`, "success");
													}}
													title={`Directly dispatch '${toolName}' as an autonomous agent directive`}
												>
													⚡ Pipe to Agent
												</button>
											</div>
										</div>
									);
								});
							})()}
							</div>

							<div className="tn_form_group" style={{ marginTop: "10px" }}>
								<label className="tn_label">
									Selected Tool: <strong style={{ color: "#fff", marginLeft: "4px" }}>{selectedTool}</strong>
									{(() => {
										const current = mcpTools.find((t) => (t.Name || t.name) === selectedTool);
										if (current && (current.Description || current.description)) {
											return (
												<span style={{ color: "#94a3b8", fontSize: "11px", marginLeft: "8px", fontWeight: "normal" }}>
													— {current.Description || current.description}
												</span>
											);
										}
										return null;
									})()}
									<Tooltip text="Selected tool for manual execution and testing." />
								</label>
							</div>

							{/* Interactive Parameter Schema & Properties Inspector */}
							{(() => {
								const currentToolObj = mcpTools.find((t) => (t.Name || t.name) === selectedTool);
								const schema = currentToolObj?.inputSchema || (currentToolObj as any)?.InputSchema;
								const props = schema?.properties || {};
								const reqList: string[] = currentToolObj?.required || (currentToolObj as any)?.Required || schema?.required || [];
								const propKeys = Object.keys(props);

								if (propKeys.length === 0) {
									return (
										<div style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "4px", padding: "6px 10px", marginBottom: "8px", fontSize: "11px", color: "#94a3b8" }}>
											ℹ️ This tool takes no required parameters. Send <code>{}</code> to execute.
										</div>
									);
								}

								return (
									<div style={{ background: "rgba(0, 0, 0, 0.25)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", padding: "6px 10px", marginBottom: "8px" }}>
										<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
											<span style={{ fontSize: "10px", fontWeight: "bold", color: "#64b5f6", textTransform: "uppercase" }}>
												Parameter Schema & Quick-Fill:
											</span>
											<span style={{ fontSize: "10px", color: "#888" }}>
												Click badge to insert property template
											</span>
										</div>
										<div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
											{propKeys.map((propKey) => {
												const propDef = props[propKey] || {};
												const isRequired = reqList.includes(propKey);
												return (
													<button
														key={propKey}
														type="button"
														className="tn_btn tn_btn_small tn_btn_secondary"
														style={{
															fontSize: "10px",
															padding: "2px 6px",
															borderColor: isRequired ? "rgba(239, 68, 68, 0.4)" : "rgba(255,255,255,0.15)",
															background: isRequired ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.04)",
														}}
														onClick={() => {
															try {
																const currentParsed = JSON.parse(toolArgs.trim() || "{}");
																if (!currentParsed[propKey]) {
																	currentParsed[propKey] = propDef.type === "string" ? "" : propDef.type === "number" ? 0 : null;
																	setToolArgs(JSON.stringify(currentParsed, null, 2));
																	showFeedback(`Inserted parameter '${propKey}' into editor`, "info");
																}
															} catch (err) {
																setToolArgs(`{\n  "${propKey}": ""\n}`);
															}
														}}
														title={`${propDef.description || "Parameter"} (${propDef.type || "any"}) ${isRequired ? "[REQUIRED]" : "[OPTIONAL]"}`}
													>
														<span style={{ color: isRequired ? "#f87171" : "#94a3b8", fontWeight: isRequired ? "bold" : "normal" }}>
															{propKey}
														</span>
														<span style={{ fontSize: "8px", opacity: 0.7, marginLeft: "4px" }}>
															({propDef.type || "string"}){isRequired ? " *" : ""}
														</span>
													</button>
												);
											})}
										</div>
									</div>
								);
							})()}

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
											onClick={() => {
												setToolArgs("{}");
												setJsonValidationError(null);
												showFeedback("Cleared arguments to empty JSON '{}'", "info");
											}}
											title="Clear arguments editor to empty JSON object"
											aria-label="Clear Arguments"
										>
											🗑 Clear
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
								<div className={`tn_tool_output ${toolErrorState ? "tn_tool_output_error" : ""}`}>
									<div className="tn_output_header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
										<div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
											<span>Invocation Result:</span>
											{lastExecutionDuration !== null && (
												<span style={{ fontSize: "10px", color: "#38bdf8" }}>
													⏱ {lastExecutionDuration}ms
												</span>
											)}
											{toolErrorState ? (
												<>
													<span className="tn_err_code_badge">
														{toolErrorState.errorCode || "ERROR"}
													</span>
													{toolRetryCount > 0 && (
														<span style={{ fontSize: "10px", color: "#f87171" }}>
															(Retries: {toolRetryCount})
														</span>
													)}
												</>
											) : (
												<span style={{ fontSize: "10px", color: "#4ade80", fontWeight: "bold" }}>
													✓ 200 OK
												</span>
											)}
										</div>
										<div style={{ display: "flex", gap: "6px" }}>
											{toolErrorState && (
												<>
													<button
														className="tn_btn tn_btn_small tn_btn_secondary"
														onClick={() => {
															navigator.clipboard?.writeText(toolOutput);
															showFeedback("Copied error output to clipboard", "info");
														}}
														title="Copy error output"
													>
														📋 Copy Error
													</button>
													<button
														className="tn_btn tn_btn_small tn_btn_secondary"
														onClick={() => {
															handleRunTool();
														}}
														title="Retry tool execution"
													>
														🔄 Retry
													</button>
												</>
											)}
											<button
												className="tn_btn tn_btn_small tn_btn_secondary"
												onClick={() => {
													setToolOutput("");
													setToolErrorState(null);
													showFeedback("Cleared output", "info");
												}}
												title="Dismiss output"
											>
												✕ Clear
											</button>
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
									</div>

									{/* Actionable Error Remediation Advice */}
									{toolErrorState?.remediation && (
										<div style={{ margin: "6px 0", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "4px", padding: "6px 8px", fontSize: "11px", color: "#fca5a5" }}>
											💡 <strong>Remediation:</strong> {toolErrorState.remediation}
										</div>
									)}

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
							<div style={{ display: "flex", gap: "6px" }}>
								<button
									type="button"
									className="tn_btn tn_btn_small tn_btn_secondary"
									onClick={async () => {
										try {
											const snapJSON = await api.exportSessionSnapshot();
											const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(snapJSON);
											const downloadAnchor = document.createElement("a");
											downloadAnchor.setAttribute("href", dataStr);
											downloadAnchor.setAttribute("download", `tormentnexus_sessions_${Date.now()}.json`);
											document.body.appendChild(downloadAnchor);
											downloadAnchor.click();
											downloadAnchor.remove();
											showFeedback("Exported session snapshot JSON", "success");
										} catch (err: any) {
											showFeedback(`Snapshot failed: ${err.message || err}`, "error");
										}
									}}
									title="Save a persistent JSON snapshot of all active terminal sessions and output buffers"
								>
									💾 Snapshot Sessions
								</button>
								<button
									className="tn_btn tn_btn_secondary"
									onClick={() => setShowSSHModal(true)}
									title="Connect to a remote server over SSH"
									style={{ borderColor: "#38bdf8", color: "#38bdf8" }}
								>
									🌐 Remote SSH
								</button>
								<button
									className="tn_btn tn_btn_secondary"
									onClick={onNewSession}
									title="Create a new terminal tab"
								>
									+ New Session
								</button>
							</div>
						</div>

						{/* Interactive Remote SSH Connect Form */}
						{showSSHModal && (
							<div style={{ marginBottom: "12px", padding: "10px", background: "rgba(56, 189, 248, 0.05)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "4px" }}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
									<span style={{ fontSize: "11px", fontWeight: "bold", color: "#38bdf8" }}>🌐 New Remote SSH Connection</span>
									<button
										type="button"
										className="tn_btn tn_btn_small tn_btn_secondary"
										onClick={() => setShowSSHModal(false)}
										style={{ fontSize: "10px", padding: "1px 6px" }}
									>
										✕ Cancel
									</button>
								</div>
								<div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 2fr auto", gap: "6px", alignItems: "center" }}>
									<input
										type="text"
										className="tn_input"
										placeholder="Host / IP (e.g. 192.168.1.5)"
										value={sshHost}
										onChange={(e) => setSshHost(e.target.value)}
										style={{ fontSize: "11px", padding: "4px 8px" }}
									/>
									<input
										type="number"
										className="tn_input"
										placeholder="Port"
										value={sshPort}
										onChange={(e) => setSshPort(parseInt(e.target.value) || 22)}
										style={{ fontSize: "11px", padding: "4px 8px" }}
									/>
									<input
										type="text"
										className="tn_input"
										placeholder="User (e.g. root)"
										value={sshUser}
										onChange={(e) => setSshUser(e.target.value)}
										style={{ fontSize: "11px", padding: "4px 8px" }}
									/>
									<input
										type="password"
										className="tn_input"
										placeholder="Password / Auth"
										value={sshPassword}
										onChange={(e) => setSshPassword(e.target.value)}
										style={{ fontSize: "11px", padding: "4px 8px" }}
									/>
									<button
										type="button"
										className="tn_btn tn_btn_small tn_btn_primary"
										onClick={async () => {
											if (!sshHost.trim() || !sshUser.trim()) {
												showFeedback("Please provide both host and username", "error");
												return;
											}
											try {
												const sess = await api.createSSHSession(sshHost.trim(), sshPort, sshUser.trim(), sshPassword);
												showFeedback(`Connected remote SSH session: ${sess.shell}`, "success");
												setShowSSHModal(false);
												setSshHost("");
												setSshPassword("");
												onNewSession();
											} catch (err: any) {
												showFeedback(`SSH Connection failed: ${err.message || err}`, "error");
											}
										}}
										style={{ fontSize: "11px", padding: "4px 10px", whiteSpace: "nowrap" }}
									>
										⚡ Connect
									</button>
								</div>
							</div>
						)}

						<div className="tn_panel_body">
							<div className="tn_session_list">
								{sessionList.map((s) => (
									<div
										key={s.uid}
										className={`tn_session_row ${
											s.uid === activeSessionId ? "tn_session_active" : ""
										}`}
										onClick={async () => {
											onSelectSession(s.uid);
											const tail = await api.getSessionOutput(s.uid, sessionTailLines);
											setSessionTailOutput(tail);
										}}
										style={{ cursor: "pointer" }}
									>
										<div className="tn_session_info">
											<span className="tn_session_name">{s.title || "Shell"}</span>
											<span
												style={{
													fontSize: "9px",
													padding: "1px 4px",
													borderRadius: "3px",
													background: (s.shell && s.shell.startsWith("ssh://")) || s.profile === "ssh" ? "rgba(56, 189, 248, 0.2)" : "rgba(74, 222, 128, 0.15)",
													color: (s.shell && s.shell.startsWith("ssh://")) || s.profile === "ssh" ? "#38bdf8" : "#4ade80",
													fontWeight: 600,
													marginRight: "4px",
												}}
											>
												{(s.shell && s.shell.startsWith("ssh://")) || s.profile === "ssh" ? "SSH" : "LOCAL"}
											</span>
											<span className="tn_session_pid">PID: {s.pid}</span>
											<span className="tn_session_shell">{s.shell}</span>
										</div>
										<div className="tn_session_actions">
											<button
												className="tn_btn tn_btn_small tn_btn_primary"
												onClick={(e) => {
													e.stopPropagation();
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
													onClick={(e) => {
														e.stopPropagation();
														onCloseSession(s.uid);
													}}
													title="Terminate this terminal process"
												>
													Terminate
												</button>
											)}
										</div>
									</div>
								))}
							</div>

							{/* Live Session Output Preview */}
							<div style={{ marginTop: "10px", background: "rgba(0,0,0,0.4)", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px" }}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
									<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
										<span style={{ fontSize: "11px", fontWeight: "bold", color: "#64b5f6" }}>
											📺 Active Session Output Tail
										</span>
										<Tooltip text="Real-time tail buffer of the selected active PTY session. Lets you inspect terminal output without leaving the dashboard." />
									</div>
									<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
										<button
											type="button"
											className="tn_btn tn_btn_small tn_btn_secondary"
											style={{ fontSize: "9px", padding: "1px 6px" }}
											onClick={() => setShowSessionOutputPreview(!showSessionOutputPreview)}
										>
											{showSessionOutputPreview ? "Hide Preview" : "Show Preview"}
										</button>
										{sessionTailOutput && showSessionOutputPreview && (
											<button
												type="button"
												className="tn_btn tn_btn_small tn_btn_secondary"
												style={{ fontSize: "9px", padding: "1px 6px" }}
												onClick={() => {
													navigator.clipboard?.writeText(sessionTailOutput);
													showFeedback("Copied session output tail to clipboard", "info");
												}}
											>
												📋 Copy
											</button>
										)}
									</div>
								</div>
								{showSessionOutputPreview && (
									<pre
										style={{
											margin: 0,
											fontSize: "10px",
											color: "#38bdf8",
											fontFamily: "monospace",
											background: "#090d16",
											padding: "6px 8px",
											borderRadius: "3px",
											maxHeight: "75px",
											overflowY: "auto",
											whiteSpace: "pre-wrap",
											border: "1px solid rgba(56, 189, 248, 0.2)",
										}}
									>
										{sessionTailOutput || "No recent output recorded for this session."}
									</pre>
								)}
							</div>

							{/* Semantic Command Blocks Inspector (Warp-style) */}
							<div style={{ marginTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "10px" }}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
									<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
										<span style={{ fontSize: "11px", fontWeight: "bold", color: "#64b5f6" }}>
											⚡ Semantic Command Blocks ({commandBlocks.length})
										</span>
										<Tooltip text="Discrete command and output stream tracking. Click '🤖 Explain & Fix' to pipe terminal errors directly to the AI agent." />
										<button
											type="button"
											className="tn_btn tn_btn_small tn_btn_secondary"
											style={{ fontSize: "9px", padding: "1px 6px", marginLeft: "4px" }}
											onClick={async () => {
												await api.clearTerminalHistory();
												setCommandBlocks([]);
												showFeedback("Cleared terminal command blocks", "info");
											}}
											title="Clear all recorded command history blocks"
										>
											Clear
										</button>
										<button
											type="button"
											className="tn_btn tn_btn_small tn_btn_secondary"
											style={{ fontSize: "9px", padding: "1px 6px" }}
											onClick={() => {
												const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(commandBlocks, null, 2));
												const downloadAnchor = document.createElement("a");
												downloadAnchor.setAttribute("href", dataStr);
												downloadAnchor.setAttribute("download", `tormentnexus_command_blocks_${Date.now()}.json`);
												document.body.appendChild(downloadAnchor);
												downloadAnchor.click();
												downloadAnchor.remove();
												showFeedback(`Exported ${commandBlocks.length} command blocks`, "success");
											}}
											title="Export terminal command blocks as JSON"
										>
											💾 Export Blocks
										</button>
									</div>
									<div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
										<div style={{ display: "flex", gap: "2px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", padding: "2px" }}>
											{(["all", "success", "failed"] as const).map((filter) => (
												<button
													key={filter}
													type="button"
													style={{
														fontSize: "9px",
														padding: "1px 5px",
														borderRadius: "3px",
														border: "none",
														background: blockStatusFilter === filter ? "#3b82f6" : "transparent",
														color: blockStatusFilter === filter ? "#fff" : "#94a3b8",
														cursor: "pointer",
														textTransform: "capitalize",
													}}
													onClick={() => setBlockStatusFilter(filter)}
												>
													{filter}
												</button>
											))}
										</div>
										<input
											type="text"
											className="tn_filter_input"
											style={{ width: "110px", padding: "2px 6px", fontSize: "10px" }}
											placeholder="Filter blocks..."
											value={blockSearchQuery}
											onChange={(e) => setBlockSearchQuery(e.target.value)}
										/>
									</div>
								</div>

								<div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
									{commandBlocks
										.filter((b) => {
											if (blockStatusFilter === "success" && !b.success) return false;
											if (blockStatusFilter === "failed" && b.success) return false;
											if (!blockSearchQuery) return true;
											const q = blockSearchQuery.toLowerCase();
											return b.command.toLowerCase().includes(q) || b.output.toLowerCase().includes(q);
										})
										.map((b) => (
											<div
												key={b.id}
												style={{
													background: "rgba(0, 0, 0, 0.35)",
													border: "1px solid rgba(255, 255, 255, 0.07)",
													borderRadius: "4px",
													padding: "6px 8px",
													display: "flex",
													flexDirection: "column",
													gap: "4px",
												}}
											>
												<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
													<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
														<span style={{ color: b.success ? "#4ade80" : "#f87171", fontSize: "11px" }}>
															{b.success ? "✓" : "✕"}
														</span>
														<code style={{ fontSize: "11px", color: "#f1f5f9" }}>{b.command}</code>
													</div>
													<div style={{ display: "flex", gap: "4px" }}>
														{b.output && (
															<button
																type="button"
																className="tn_btn tn_btn_small tn_btn_secondary"
																style={{ fontSize: "9px", padding: "1px 6px" }}
																onClick={() => {
																	navigator.clipboard?.writeText(b.output);
																	showFeedback("Output copied to clipboard", "info");
																}}
																title="Copy block output to clipboard"
															>
																📋 Copy
															</button>
														)}
														<button
															type="button"
															className="tn_btn tn_btn_small tn_btn_secondary"
															style={{ fontSize: "9px", padding: "1px 6px" }}
															onClick={() => {
																setAgentCommand(`Analyze and fix output of '${b.command}': ${b.output.slice(0, 200)}`);
																showFeedback(`Piped command block '${b.command}' into Agent directive!`, "success");
															}}
															title="Send command output to Autonomous Agent for explanation or troubleshooting"
														>
															🤖 Explain & Fix
														</button>
													</div>
												</div>
												{b.output && (
													<pre
														style={{
															margin: 0,
															fontSize: "10px",
															color: "#94a3b8",
															fontFamily: "monospace",
															maxHeight: "45px",
															overflow: "hidden",
															textOverflow: "ellipsis",
														}}
													>
														{b.output}
													</pre>
												)}
											</div>
										))}
									{commandBlocks.length === 0 && (
										<div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "8px" }}>
											No command history blocks recorded yet.
										</div>
									)}
								</div>
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

					{/* SECTION 5: Terminal Plugins & Extensions Hub */}
					<div className="tn_dashboard_panel tn_panel_full">
						<div className="tn_panel_header">
							<div className="tn_panel_title">
								🧩 Terminal Plugins & Themes Hub
								<Tooltip text="Discover, enable, and manage curated terminal extensions, visual themes, and workflow enhancers." />
							</div>
							<div style={{ display: "flex", gap: "6px" }}>
								{["ALL", "Theme", "Productivity", "Navigation", "Visuals"].map((cat) => (
									<button
										key={cat}
										type="button"
										className={`tn_btn tn_btn_small ${pluginFilter === cat ? "tn_btn_primary" : "tn_btn_secondary"}`}
										onClick={() => setPluginFilter(cat)}
										style={{ fontSize: "9px", padding: "1px 6px" }}
									>
										{cat}
									</button>
								))}
							</div>
						</div>

						<div className="tn_panel_body">
							<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
								{pluginsList
									.filter((p) => pluginFilter === "ALL" || p.category === pluginFilter)
									.map((p) => (
										<div
											key={p.name}
											style={{
												background: "rgba(0,0,0,0.3)",
												border: "1px solid rgba(255,255,255,0.08)",
												borderRadius: "6px",
												padding: "10px",
												display: "flex",
												flexDirection: "column",
												justifyContent: "space-between",
												gap: "8px",
											}}
										>
											<div>
												<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
													<strong style={{ color: "#f8fafc", fontSize: "12px" }}>{p.name}</strong>
													<span
														style={{
															fontSize: "9px",
															padding: "1px 6px",
															borderRadius: "3px",
															background: p.installed ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.2)",
															color: p.installed ? "#4ade80" : "#94a3b8",
															border: `1px solid ${p.installed ? "rgba(34, 197, 94, 0.4)" : "rgba(148, 163, 184, 0.3)"}`,
														}}
													>
														{p.installed ? "INSTALLED" : p.category}
													</span>
												</div>
												<div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.4" }}>
													{p.description}
												</div>
											</div>
											<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
												<a
													href={p.url}
													target="_blank"
													rel="noreferrer"
													style={{ fontSize: "10px", color: "#38bdf8", textDecoration: "none" }}
												>
													GitHub ↗
												</a>
												<button
													type="button"
													className={`tn_btn tn_btn_small ${p.installed ? "tn_btn_secondary" : "tn_btn_success"}`}
													onClick={async () => {
														await api.installPlugin(p.name);
														setPluginsList((prev) =>
															prev.map((item) => (item.name === p.name ? { ...item, installed: true } : item))
														);
														showFeedback(`Installed and enabled plugin: ${p.name}`, "success");
													}}
													disabled={p.installed}
													style={{ fontSize: "10px", padding: "2px 8px" }}
												>
													{p.installed ? "✓ Enabled" : "+ Install"}
												</button>
											</div>
										</div>
									))}
							</div>
						</div>
					</div>

					{/* SECTION 6: Quick Settings & Preferences */}
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

				{/* Quick-Access Keyboard Shortcuts Bar */}
				<div className="tn_shortcuts_footer">
					<div className="tn_shortcut_item">
						<kbd>Esc</kbd> <span>Return to Shell</span>
					</div>
					<div className="tn_shortcut_item">
						<kbd>Ctrl+Shift+D</kbd> <span>Toggle Dashboard</span>
					</div>
					<div className="tn_shortcut_item">
						<kbd>Ctrl+Enter</kbd> <span>Run Selected Tool</span>
					</div>
					<div className="tn_shortcut_item">
						<kbd>Enter</kbd> <span>Dispatch Agent Directive</span>
					</div>
				</div>
			</div>
		</div>
	);
}
