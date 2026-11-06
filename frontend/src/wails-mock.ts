// Fallback mock for browser environments outside of Wails runtime
if (typeof window !== "undefined") {
	if (!(window as any).runtime) {
		(window as any).runtime = {
			EventsOn: () => {},
			EventsOff: () => {},
			EventsEmit: () => {},
			EventsOnMultiple: () => {},
			EventsOnce: () => {},
			Quit: () => {},
			BrowserOpenURL: (url: string) => window.open(url, "_blank"),
		};
	}
	if (!(window as any).go) {
		(window as any).go = {
			main: {
				App: {
					WindowMinimise: () => {},
					WindowMaximise: () => {},
					WindowUnmaximise: () => {},
					WindowToggleMaximise: () => {},
					WindowFullscreen: () => {},
					WindowUnfullscreen: () => {},
					GetServerStatus: async () => ({
						mcpServerRunning: true,
						mcpServerPort: 8080,
						agentRunning: false,
						trayEnabled: true,
						activeSessions: 1,
						uptimeSeconds: 42,
						version: "1.0.0",
					}),
					RestartServers: async () => ({ status: "success", error: "" }),
					StopServers: async () => ({ status: "stopped", error: "" }),
					ToggleSystemTray: async () => true,
					QuitApp: () => {},
				},
				SessionManager: {
					CreateSession: async () => ({
						uid: "sess-default-1",
						shell: "/bin/bash",
						pid: 1234,
						rows: 24,
						cols: 80,
						profile: "default",
					}),
					WriteData: async () => {},
					ResizeSession: async () => {},
					CloseSession: async () => {},
					GetSession: async () => null,
					ListSessions: async () => [],
				},
				ConfigManager: {
					GetConfig: async () => ({
						fontSize: 12,
						fontFamily: "monospace",
					}),
					GetConfigValue: async () => null,
					SetConfigValue: async () => {},
					SetConfig: async () => {},
					GetShell: async () => "/bin/bash",
					GetShellArgs: async () => [],
					GetKeymaps: async () => ({}),
					OpenConfigInEditor: async () => {},
				},
				AgentHarness: {
					ExecuteCommand: async (cmd: string) => ({
						status: cmd === "start" ? "running" : "idle",
						running: cmd === "start",
						messages: 1,
						response: `Executed ${cmd}`,
					}),
					GetStatus: async () => ({ status: "idle", running: false, messages: 0 }),
					HealthCheck: async () => ({ status: "active", running: false, messages: 0 }),
				},
				MCPAggregator: {
					ListTools: async () => [
						{ name: "shell_execute", description: "Execute shell command", inputSchema: { type: "object" } },
						{ name: "file_read", description: "Read file contents", inputSchema: { type: "object" } },
						{ name: "file_write", description: "Write file contents", inputSchema: { type: "object" } },
						{ name: "agent_status", description: "Check agent status", inputSchema: { type: "object" } },
						{ name: "session_list", description: "List terminal sessions", inputSchema: { type: "object" } },
					],
					CallTool: async (name: string, args: any) => ({
						tool: name,
						status: "executed",
						statusCode: 200,
						durationMs: 14,
						args,
						result: "Executed successfully in TormentNexus",
					}),
					GetTelemetry: async () => ({ status: "active", active_tools: 5, servers: 1, version: "1.0.0" }),
					GetToolExecutionHistory: async () => [
						{ tool: "shell_execute", statusCode: 200, durationMs: 18, timestamp: Date.now() - 5000, success: true, status: "executed" },
						{ tool: "file_read", statusCode: 200, durationMs: 12, timestamp: Date.now() - 4000, success: true, status: "executed" },
						{ tool: "file_write", statusCode: 200, durationMs: 22, timestamp: Date.now() - 3000, success: true, status: "executed" },
						{ tool: "agent_status", statusCode: 200, durationMs: 9, timestamp: Date.now() - 2000, success: true, status: "executed" },
						{ tool: "session_list", statusCode: 200, durationMs: 15, timestamp: Date.now() - 1000, success: true, status: "executed" },
					],
					ListServers: async () => [],
				},
			},
		};
	}
}
export {};
