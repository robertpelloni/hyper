// Bridge between Wails Go backend and React frontend
// Uses the auto-generated Wails bindings from frontend/wailsjs/go/

import * as AppBindings from "../wailsjs/go/main/App";
import * as SessionBindings from "../wailsjs/go/main/SessionManager";
import * as ConfigBindings from "../wailsjs/go/main/ConfigManager";
import * as AgentBindings from "../wailsjs/go/main/AgentHarness";
import * as MCPBindings from "../wailsjs/go/main/MCPAggregator";
import * as WailsRuntime from "../wailsjs/runtime/runtime";

import type {
	AppConfig,
	SessionInfo,
	AgentStatus,
	MCPTool,
	MCPTelemetry,
	ServerStatus,
	TerminalBlock,
} from "./types";

// Helper for window['go'] dynamic access for newly added methods before wails generate
function getGoApp(): any {
	if (typeof window !== "undefined" && (window as any).go && (window as any).go.main && (window as any).go.main.App) {
		return (window as any).go.main.App;
	}
	return AppBindings;
}

// ===== Session Management =====
export async function createSession(options: {
	shell?: string;
	args?: string[];
	cwd?: string;
	rows?: number;
	cols?: number;
	profile?: string;
}): Promise<SessionInfo> {
	const result = await SessionBindings.CreateSession(
		options.shell || "",
		options.args || [],
		options.cwd || "",
		options.rows || 24,
		options.cols || 80,
		options.profile || "default",
	);
	return result as SessionInfo;
}

export async function writeSessionData(
	uid: string,
	data: string,
): Promise<void> {
	return SessionBindings.WriteData(uid, data);
}

export async function resizeSession(
	uid: string,
	rows: number,
	cols: number,
): Promise<void> {
	return SessionBindings.ResizeSession(uid, rows, cols);
}

export async function closeSession(uid: string): Promise<void> {
	return SessionBindings.CloseSession(uid);
}

export async function getSession(uid: string): Promise<SessionInfo> {
	return SessionBindings.GetSession(uid) as Promise<SessionInfo>;
}

export async function listSessions(): Promise<SessionInfo[]> {
	return SessionBindings.ListSessions() as Promise<SessionInfo[]>;
}

export async function getSessionOutput(uid: string, maxLines: number = 20): Promise<string> {
	const app = getGoApp();
	if (app && app.GetSessionOutput) {
		return app.GetSessionOutput(uid, maxLines);
	}
	return "";
}

// ===== Configuration =====
export async function getConfig(): Promise<AppConfig> {
	return ConfigBindings.GetConfig() as Promise<AppConfig>;
}

export async function getConfigValue(key: string): Promise<any> {
	return ConfigBindings.GetConfigValue(key);
}

export async function setConfigValue(key: string, value: any): Promise<void> {
	return ConfigBindings.SetConfigValue(key, value);
}

export async function setConfig(config: AppConfig): Promise<void> {
	return ConfigBindings.SetConfig(config);
}

export async function getShell(): Promise<string> {
	return ConfigBindings.GetShell();
}

export async function getShellArgs(): Promise<string[]> {
	return ConfigBindings.GetShellArgs();
}

export async function getKeymaps(): Promise<Record<string, string>> {
	return ConfigBindings.GetKeymaps() as Promise<Record<string, string>>;
}

export async function openConfigInEditor(): Promise<void> {
	return ConfigBindings.OpenConfigInEditor();
}

// ===== Window Controls =====
export function windowMinimise(): void {
	AppBindings.WindowMinimise();
}
export function windowMaximise(): void {
	AppBindings.WindowMaximise();
}
export function windowUnmaximise(): void {
	AppBindings.WindowUnmaximise();
}
export function windowToggleMaximise(): void {
	AppBindings.WindowToggleMaximise();
}
export function windowClose(): void {
	WailsRuntime.Quit();
}
export function windowIsMaximised(): boolean {
	return false;
}
export function windowFullscreen(): void {
	AppBindings.WindowFullscreen();
}
export function windowUnfullscreen(): void {
	AppBindings.WindowUnfullscreen();
}

// ===== Server Lifecycle & Tray Controls =====
export async function getServerStatus(): Promise<ServerStatus> {
	const app = getGoApp();
	if (app && app.GetServerStatus) {
		return app.GetServerStatus();
	}
	return {
		mcpServerRunning: true,
		mcpServerPort: 8080,
		agentRunning: false,
		trayEnabled: true,
		activeSessions: 1,
		uptimeSeconds: 0,
		version: "1.0.0",
	};
}

export async function restartServers(): Promise<any> {
	const app = getGoApp();
	if (app && app.RestartServers) {
		return app.RestartServers();
	}
	return { status: "simulated", error: "" };
}

export async function stopServers(): Promise<any> {
	const app = getGoApp();
	if (app && app.StopServers) {
		return app.StopServers();
	}
	return { status: "stopped", error: "" };
}

export async function toggleSystemTray(): Promise<boolean> {
	const app = getGoApp();
	if (app && app.ToggleSystemTray) {
		return app.ToggleSystemTray();
	}
	return true;
}

export async function exportSessionSnapshot(): Promise<string> {
	const app = getGoApp();
	if (app && app.ExportSessionSnapshot) {
		return app.ExportSessionSnapshot();
	}
	return JSON.stringify({
		version: "1.1.0",
		timestamp: Math.floor(Date.now() / 1000),
		count: 1,
		sessions: [
			{
				id: "sess-default",
				shell: "/bin/bash",
				pid: 1234,
				cwd: "/workspace",
				profile: "default",
				output_buf: ["[bash] session active: pid 1234", "$ echo 'Session snapshot ready'"],
			},
		],
	}, null, 2);
}

export async function quitApp(): Promise<void> {
	const app = getGoApp();
	if (app && app.QuitApp) {
		return app.QuitApp();
	}
	WailsRuntime.Quit();
}

// ===== Agent =====
export async function agentExecuteCommand(
	command: string,
): Promise<AgentStatus> {
	return AgentBindings.ExecuteCommand(command) as Promise<AgentStatus>;
}

export async function agentGetStatus(): Promise<AgentStatus> {
	return AgentBindings.GetStatus() as Promise<AgentStatus>;
}

export async function agentHealthCheck(): Promise<AgentStatus> {
	return AgentBindings.HealthCheck() as Promise<AgentStatus>;
}

export async function agentQueueTask(task: string): Promise<any> {
	if (typeof window !== "undefined" && (window as any).go && (window as any).go.main && (window as any).go.main.AgentHarness && (window as any).go.main.AgentHarness.QueueTask) {
		return (window as any).go.main.AgentHarness.QueueTask(task);
	}
	return { status: "queued", task, queue: [task] };
}

export async function agentGetTaskQueue(): Promise<string[]> {
	if (typeof window !== "undefined" && (window as any).go && (window as any).go.main && (window as any).go.main.AgentHarness && (window as any).go.main.AgentHarness.GetTaskQueue) {
		return (window as any).go.main.AgentHarness.GetTaskQueue();
	}
	return [];
}

// ===== Terminal Command Blocks & History =====
export async function getTerminalHistory(): Promise<TerminalBlock[]> {
	const app = getGoApp();
	if (app && app.GetTerminalHistory) {
		return app.GetTerminalHistory();
	}
	return [
		{
			id: 1,
			command: "git status",
			output: "On branch main\nYour branch is up to date with 'origin/main'.",
			success: true,
			timestamp: new Date().toISOString(),
		},
		{
			id: 2,
			command: "npm test",
			output: "PASS internal/terminal/buffer_test.go",
			success: true,
			timestamp: new Date().toISOString(),
		},
	];
}

export async function searchTerminalHistory(keyword: string): Promise<TerminalBlock[]> {
	const app = getGoApp();
	if (app && app.SearchTerminalHistory) {
		return app.SearchTerminalHistory(keyword);
	}
	const all = await getTerminalHistory();
	if (!keyword) return all;
	return all.filter((b) => b.command.includes(keyword) || b.output.includes(keyword));
}

export async function recordTerminalCommand(
	cmd: string,
	output: string,
	success: boolean,
): Promise<TerminalBlock> {
	const app = getGoApp();
	if (app && app.RecordTerminalCommand) {
		return app.RecordTerminalCommand(cmd, output, success);
	}
	return {
		id: Date.now(),
		command: cmd,
		output,
		success,
		timestamp: new Date().toISOString(),
	};
}

export async function clearTerminalHistory(): Promise<void> {
	const app = getGoApp();
	if (app && app.ClearTerminalHistory) {
		return app.ClearTerminalHistory();
	}
}

// ===== Terminal Plugins & Extensions Hub =====
export async function getInstalledPlugins(): Promise<string[]> {
	const app = getGoApp();
	if (app && app.GetInstalledPlugins) {
		return app.GetInstalledPlugins();
	}
	return ["hyper-snazzy"];
}

export async function getRecommendedPlugins(): Promise<any[]> {
	const app = getGoApp();
	if (app && app.GetRecommendedPlugins) {
		return app.GetRecommendedPlugins();
	}
	return [
		{
			name: "hyper-snazzy",
			description: "Elegant and vivid terminal theme with crisp syntax colors",
			category: "Theme",
			installed: true,
			url: "https://github.com/sindresorhus/hyper-snazzy",
		},
		{
			name: "hypercwd",
			description: "Opens new tabs with the current active directory from the previous tab",
			category: "Productivity",
			installed: false,
			url: "https://github.com/hharnisc/hypercwd",
		},
		{
			name: "hyper-search",
			description: "Search text within the terminal buffer using Ctrl+Shift+F",
			category: "Productivity",
			installed: false,
			url: "https://github.com/zeit/hyper-search",
		},
		{
			name: "hyper-pane",
			description: "Enhanced pane navigation and directional focus switching shortcuts",
			category: "Navigation",
			installed: false,
			url: "https://github.com/chabou/hyper-pane",
		},
		{
			name: "hyperpower",
			description: "Particle visual effects and cursor explosions when typing commands",
			category: "Visuals",
			installed: false,
			url: "https://github.com/zeit/hyperpower",
		},
	];
}

export async function installPlugin(name: string): Promise<boolean> {
	const app = getGoApp();
	if (app && app.InstallPlugin) {
		return app.InstallPlugin(name);
	}
	return true;
}

export async function agentRemoveTask(index: number): Promise<string[]> {
	if (typeof window !== "undefined" && (window as any).go && (window as any).go.main && (window as any).go.main.AgentHarness && (window as any).go.main.AgentHarness.RemoveTask) {
		return (window as any).go.main.AgentHarness.RemoveTask(index);
	}
	return [];
}

export async function agentClearTaskQueue(): Promise<string[]> {
	if (typeof window !== "undefined" && (window as any).go && (window as any).go.main && (window as any).go.main.AgentHarness && (window as any).go.main.AgentHarness.ClearTaskQueue) {
		return (window as any).go.main.AgentHarness.ClearTaskQueue();
	}
	return [];
}

// ===== MCP =====
export async function mcpListTools(): Promise<MCPTool[]> {
	return MCPBindings.ListTools() as Promise<MCPTool[]>;
}

export async function mcpCallTool(
	name: string,
	args: Record<string, any>,
): Promise<any> {
	return MCPBindings.CallTool(name, args);
}

export async function mcpGetTelemetry(): Promise<MCPTelemetry> {
	return MCPBindings.GetTelemetry() as Promise<MCPTelemetry>;
}

export async function mcpListServers(): Promise<any[]> {
	return MCPBindings.ListServers();
}

// ===== Events (use Wails runtime) =====
export function onEvent(
	eventName: string,
	callback: (...data: any[]) => void,
): void {
	WailsRuntime.EventsOn(eventName, callback);
}

export function offEvent(eventName: string): void {
	WailsRuntime.EventsOff(eventName);
}

export function emitEvent(eventName: string, ...data: any[]): void {
	WailsRuntime.EventsEmit(eventName, ...data);
}

// ===== System =====
export function getPlatform(): string {
	return "linux";
}
export function getHomeDir(): string {
	return "/home";
}
export function getAppVersion(): string {
	return "1.0.0";
}
export function getAppName(): string {
	return "TormentNexus";
}
export function openURL(url: string): void {
	WailsRuntime.BrowserOpenURL(url);
}

export async function mcpGetToolExecutionHistory(): Promise<ToolExecutionRecord[]> {
	if (typeof window !== "undefined" && (window as any).go && (window as any).go.main && (window as any).go.main.MCPAggregator && (window as any).go.main.MCPAggregator.GetToolExecutionHistory) {
		return (window as any).go.main.MCPAggregator.GetToolExecutionHistory();
	}
	// Fallback fetch from HTTP endpoint if running
	try {
		const res = await fetch("http://localhost:8080/history");
		if (res.ok) {
			const data = await res.json();
			return data.history || [];
		}
	} catch {}
	return [];
}

export async function mcpClearToolExecutionHistory(): Promise<void> {
	const app = getGoApp();
	if (app && app.ClearMCPExecutionHistory) {
		return app.ClearMCPExecutionHistory();
	}
	try {
		await fetch("http://localhost:8080/history", { method: "DELETE" });
	} catch {}
}

export async function agentGetExecutionSteps(): Promise<AgentExecutionStep[]> {
	if (typeof window !== "undefined" && (window as any).go && (window as any).go.main && (window as any).go.main.AgentHarness && (window as any).go.main.AgentHarness.GetExecutionSteps) {
		return (window as any).go.main.AgentHarness.GetExecutionSteps();
	}
	return [];
}
