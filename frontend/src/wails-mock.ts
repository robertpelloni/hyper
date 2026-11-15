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
	(window as any).go = (window as any).go || {};
	(window as any).go.main = (window as any).go.main || {};

	const defaultApp = {
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
			version: "1.1.0",
		}),
		RestartServers: async () => ({ status: "success", error: "" }),
		StopServers: async () => ({ status: "stopped", error: "" }),
		ToggleSystemTray: async () => true,
		QuitApp: () => {},
		GetTerminalHistory: async () => [
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
		],
		SearchTerminalHistory: async (kw: string) => [],
		RecordTerminalCommand: async () => ({}),
		ClearTerminalHistory: async () => {},
		GetSessionOutput: async (uid: string, maxLines: number) => {
			return "[bash] session active: pid 1234\n$ tormentnexus --version\nTormentNexus v1.1.0\n$ echo 'Ready for user directives.'\nReady for user directives.";
		},
		GetInstalledPlugins: async () => ["hyper-snazzy"],
		GetRecommendedPlugins: async () => [
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
		],
		InstallPlugin: async (name: string) => true,
		ExportSessionSnapshot: async () => JSON.stringify({
			version: "1.1.0",
			timestamp: Math.floor(Date.now() / 1000),
			count: 1,
			sessions: [{
				id: "mock-session-1",
				shell: "/bin/bash",
				pid: 1234,
				cwd: "/workspace",
				profile: "default",
				output_buf: ["[bash] session active: pid 1234", "$ echo 'Session snapshot ready'"],
			}],
		}, null, 2),
	};

	const defaultSessionManager = {
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
	};

	const defaultConfigManager = {
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
	};

	const defaultAgentHarness = {
		ExecuteCommand: async (cmd: string) => ({
			status: cmd === "start" ? "running" : "idle",
			running: cmd === "start",
			messages: 1,
			response: `Executed ${cmd}`,
		}),
		GetStatus: async () => ({ status: "idle", running: false, messages: 0 }),
		HealthCheck: async () => ({ status: "active", running: false, messages: 0 }),
		GetExecutionSteps: async () => [
          {
            id: "step-0",
            phase: "PLAN",
            thought: "Synthesizing execution plan for objective: 'scan_sessions'",
            timestamp: Date.now() - 6000,
          },
			{
				id: "step-1",
				phase: "THINK",
				thought: "Analyzing environment: scanning registered MCP tools and sessions.",
				durationMs: 0,
				timestamp: Date.now() - 3000,
			},
			{
				id: "step-2",
				phase: "ACT",
				tool: "session_list",
				thought: "Querying active terminal sessions from Go core.",
				durationMs: 0,
				timestamp: Date.now() - 2000,
			},
			{
				id: "step-3",
				phase: "OBSERVE",
				tool: "session_list",
				thought: "Observed 1 active PTY session. Terminal state healthy.",
				result: "{count: 1, shell: '/bin/bash'}",
				durationMs: 8,
				timestamp: Date.now() - 1000,
			},
          {
            id: "step-4",
            phase: "REFLECT",
            tool: "session_list",
            thought: "Goal 'scan_sessions' successfully resolved via 'session_list'. System state consistent.",
            durationMs: 8,
            timestamp: Date.now() - 2000,
          },
		],
        _mockQueue: ["scan_sessions", "check_config"],
        QueueTask: async function(task: string) {
            this._mockQueue.push(task);
            return { status: "queued", task, queue: [...this._mockQueue] };
        },
        GetTaskQueue: async function() {
            return [...this._mockQueue];
        },
        RemoveTask: async function(index: number) {
            if (index >= 0 && index < this._mockQueue.length) {
                this._mockQueue.splice(index, 1);
            }
            return [...this._mockQueue];
        },
        ClearTaskQueue: async function() {
            this._mockQueue = [];
            return [];
        },
	};

	const defaultMCPAggregator = {
		ListTools: async () => [
			{
				name: "shell_execute",
				category: "System",
				description: "Execute shell command in TormentNexus",
				inputSchema: {
					type: "object",
					properties: {
						command: { type: "string", description: "The bash shell command to execute" },
					},
					required: ["command"],
				},
				required: ["command"],
			},
			{
				name: "file_read",
				category: "Filesystem",
				description: "Read file contents from workspace",
				inputSchema: {
					type: "object",
					properties: {
						path: { type: "string", description: "File path relative to workspace root" },
					},
					required: ["path"],
				},
				required: ["path"],
			},
			{
				name: "file_write",
				category: "Filesystem",
				description: "Write content to a workspace file",
				inputSchema: {
					type: "object",
					properties: {
						path: { type: "string", description: "File path relative to workspace root" },
						content: { type: "string", description: "Content string to write" },
					},
					required: ["path", "content"],
				},
				required: ["path", "content"],
			},
			{
				name: "agent_status",
				category: "Agent",
				description: "Query autonomous agent status and reasoning traces",
				inputSchema: { type: "object", properties: {} },
			},
			{
				name: "session_list",
				category: "System",
				description: "List active terminal sessions and states",
				inputSchema: { type: "object", properties: {} },
			},
			{
				name: "workspace_search",
				category: "Intelligence",
				description: "Search workspace file paths and contents",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search term or regex pattern" },
					},
					required: ["query"],
				},
				required: ["query"],
			},
			{
				name: "git_status",
				category: "System",
				description: "Query current Git branch and repository state",
				inputSchema: { type: "object", properties: {} },
			},
			{
				name: "system_info",
				category: "System",
				description: "Get CPU, memory, and OS runtime info",
				inputSchema: { type: "object", properties: {} },
			},
		],
		CallTool: async (name: string, args: any) => {
			if (name === "shell_execute" && (!args || !args.command)) {
				return {
					tool: name,
					status: "failed",
					statusCode: 400,
					errorCode: "MISSING_REQUIRED_ARG",
					missingArg: "command",
					error: "Missing required argument: 'command'",
					remediation: "Provide 'command' in the arguments JSON object and retry",
					durationMs: 5,
				};
			}
			return {
				tool: name,
				status: "executed",
				statusCode: 200,
				durationMs: 14,
				args,
				result: "Executed successfully in TormentNexus",
			};
		},
		GetTelemetry: async () => ({ status: "active", active_tools: 5, servers: 1, version: "1.1.0" }),
		GetToolExecutionHistory: async () => [
			{ tool: "shell_execute", statusCode: 200, durationMs: 18, timestamp: Date.now() - 5000, success: true, status: "executed" },
			{ tool: "file_read", statusCode: 200, durationMs: 12, timestamp: Date.now() - 4000, success: true, status: "executed" },
			{ tool: "file_write", statusCode: 200, durationMs: 22, timestamp: Date.now() - 3000, success: true, status: "executed" },
			{ tool: "agent_status", statusCode: 200, durationMs: 9, timestamp: Date.now() - 2000, success: true, status: "executed" },
			{ tool: "session_list", statusCode: 200, durationMs: 15, timestamp: Date.now() - 1000, success: true, status: "executed" },
		],
		ListServers: async () => [],
	};

	if (!(window as any).go.main.App) (window as any).go.main.App = defaultApp;
	if (!(window as any).go.main.SessionManager) (window as any).go.main.SessionManager = defaultSessionManager;
	if (!(window as any).go.main.ConfigManager) (window as any).go.main.ConfigManager = defaultConfigManager;
	if (!(window as any).go.main.AgentHarness) (window as any).go.main.AgentHarness = defaultAgentHarness;
	if (!(window as any).go.main.MCPAggregator) (window as any).go.main.MCPAggregator = defaultMCPAggregator;
}
export {};
