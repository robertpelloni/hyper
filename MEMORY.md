# TormentNexus Architectural Memory

- **Project Identity:** TormentNexus is the exclusive project branding across all files, binaries, scripts, and interfaces.
- **Single-Page Mission Control UI:** All mission-critical controls (Autonomous Agent Harness, MCP Aggregator & Runner, Terminal Session Manager, Server Lifecycle, System Tray, and Quick Config) are organized on a singular, consolidated page with high-value telemetry displayed prominently.
- **Tooltips & Guidance:** Every interactive control and informational badge features contextual tooltip markers (`?`) explaining its operational purpose and structural role.
- **Server Lifecycle:** Backend HTTP MCP server runs on `:8080` with endpoints `/tools`, `/call` (supporting POST execution), and `/history`. Server shutdown and restart are controllable via frontend bindings and system tray menus.
- **Autonomous Agent Harness:** Employs a structured Think-Act-Observe cycle directly integrated with `MCPAggregator`. Streams `AgentExecutionStep` records in real-time via `agent:step` events.
- **MCP Tool Performance Monitor:** Features latency tracking, HTTP status pills (`200 OK`), mini history bar graphs, automatic argument templates, and keyboard execution (`Ctrl+Enter`).
- **Interactive Tool Piping:** Results from MCP tool executions can be piped directly into autonomous agent directive inputs via "Send to Agent Directive".
- **Go Core Requirement:** Built with Go v1.25.0/v1.26.x compatible runtime.
- **Frontend Architecture:** Built using Vite in `frontend` directory and embedded into Go binary (`//go:embed all:frontend/dist`). Standalone testing requires local HTTP server or mock stubs for `window.runtime` and `window.go`.
- **Script Governance:** Redundant scripts are archived non-destructively in `archive/`. Primary runners are `build.sh` / `start.sh` (Linux/macOS) and `build.bat` / `start.bat` (Windows).
