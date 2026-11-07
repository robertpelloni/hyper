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

## Upcoming Milestones (Phase 3 Autonomous Swarm)
- [ ] Multi-language parity: port core subsystems to Rust, C#, and Java matching Go and TypeScript.
- [ ] Multi-agent collaborative swarm execution and task delegation.
- [ ] WASM-sandboxed tool execution runner.
- [ ] Support custom MCP servers over stdio, WebSockets, and SSE transport.
- [ ] Command block separation and semantic code indexing in terminal scrollback.
- [ ] Configuration hot-reloading without terminal session interruption.
