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
} from "./types";

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

export async function executeNotebookCell(command: string, cwd: string = ""): Promise<any> {
	// @ts-ignore - dynamic bindings may not have been re-generated for tsc yet
	return SessionBindings.ExecuteNotebookCell(command, cwd);
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
	return false; /* async in wails */
}
export function windowFullscreen(): void {
	AppBindings.WindowFullscreen();
}
export function windowUnfullscreen(): void {
	AppBindings.WindowUnfullscreen();
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

export async function agentSearchCodex(query: string): Promise<string[]> {
	// @ts-ignore - dynamic bindings may not have been re-generated for tsc yet
	return AgentBindings.SearchCodex(query);
}

export async function agentGetCommandContext(command: string): Promise<string> {
	// @ts-ignore - dynamic bindings may not have been re-generated for tsc yet
	return AgentBindings.GetCommandContext(command);
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
	return "windows";
}
export function getHomeDir(): string {
	return ""; /* async in wails, use AppBindings */
}
export function getAppVersion(): string {
	return "";
}
export function getAppName(): string {
	return "";
}
export function openURL(url: string): void {
	WailsRuntime.BrowserOpenURL(url);
}
