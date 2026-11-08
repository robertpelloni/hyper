# TODO: TormentNexus

## Immediate Tasks (Phase 2 Completed)
- [x] Consolidate fragmented dashboard features into a single, cohesive Mission Control page.
- [x] Implement System Tray icon support and application server shutdown controls.
- [x] Implement HTTP `/call` POST handler in `internal/mcp/server.go`.
- [x] Add descriptive labels, interactive forms, and tooltip markers for all dashboard components.
- [x] Non-destructively archive legacy scripts and provide cross-platform build/start scripts.
- [x] Connect agent harness directly to MCP tools for Think-Act-Observe autonomous workflows.
- [x] Stream real-time `agent:step` telemetry and display phase badges in Dashboard.
- [x] Implement MCP tool performance cards with latency tracking and mini history bar charts.
- [x] Add one-click argument template pre-population and "Send to Agent Directive" result piping.
- [x] Add real-time client-side JSON syntax validation and inline error display for tool runner.
- [x] Implement Format JSON and Reset Template utility actions in Mission Control.
- [x] Harden Go MCP server with 1MB payload limits and structured error codes (413, 400, 404).

## Immediate Tasks (Phase 2 Completed)
- [x] Consolidate fragmented dashboard features into a single, cohesive Mission Control page.
- [x] Implement System Tray icon support and application server shutdown controls.
- [x] Implement HTTP `/call` POST handler in `internal/mcp/server.go`.
- [x] Add descriptive labels, interactive forms, and tooltip markers for all dashboard components.
- [x] Non-destructively archive legacy scripts and provide cross-platform build/start scripts.
- [x] Connect agent harness directly to MCP tools for Think-Act-Observe autonomous workflows.
- [x] Stream real-time `agent:step` telemetry and display phase badges in Dashboard.
- [x] Implement MCP tool performance cards with latency tracking and mini history bar charts.
- [x] Add one-click argument template pre-population and "Send to Agent Directive" result piping.
- [x] Add real-time client-side JSON syntax validation and inline error display for tool runner.
- [x] Implement Format JSON and Reset Template utility actions in Mission Control.
- [x] Harden Go MCP server with 1MB payload limits and structured error codes (413, 400, 404).
- [x] Implement semantic command block tracking and history search in `internal/terminal/buffer.go`.
- [x] Expose command history and search bindings in Go application core (`app_core.go`).
- [x] Support dynamic parameterized directives (`file_read:`, `shell_execute:`) in `AgentHarness`.
- [x] Add cognitive phase filtering pills (`ALL`, `PLAN`, `THINK`, `ACT`, `OBSERVE`, `REFLECT`) to Agent Control Panel.
- [x] Integrate Warp-style Semantic Command Blocks inspector and "Explain & Fix" action in Mission Control.
- [x] Expand MCP Tool registry with `workspace_search`, `git_status`, and `system_info` tools.
- [x] Add MCP category filtering pills (`ALL`, `System`, `Filesystem`, `Agent`, `Intelligence`).
- [x] Implement JSON export utilities for reasoning step telemetry (`Export Steps`) and command block history (`Export Blocks`).
- [x] Add live terminal session output tail inspection with Hide/Show toggle and copy utilities in Mission Control.
- [x] Implement Terminal Plugins & Themes Hub with category filtering, install/status tracking, and persistent configuration.
- [x] Expand Quick-Start Onboarding Guide to 4-step interactive workflow including plugin customization.

## Upcoming Milestones (Phase 3 Autonomous Swarm)
- [ ] Multi-language parity: port core subsystems to Rust, C#, and Java matching Go and TypeScript.
- [ ] Multi-agent collaborative swarm execution and task delegation.
- [ ] WASM-sandboxed tool execution runner.
- [ ] Support custom MCP servers over stdio, WebSockets, and SSE transport.
- [ ] Configuration hot-reloading without terminal session interruption.
