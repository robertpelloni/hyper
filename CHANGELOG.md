# CHANGELOG: TormentNexus

## [1.1.0] - 2026-11-04
### Added
- **Mission Control Dashboard:** Singular, consolidated dashboard combining Agent Harness, MCP Tool Aggregator, Terminal Orchestration, Server Lifecycle, and Quick Config.
- **System Tray & Server Lifecycle Controls:** Ability to cleanly stop, restart, and inspect all backend servers and quit the app cleanly via menu, UI, and Go bindings.
- **Contextual Tooltip System:** Added informative tooltips and guidance markers across all UI controls and telemetry badges.
- **Interactive MCP Tool Runner:** Built-in form to select, configure arguments, and execute any registered MCP tool with formatted JSON output.
- **HTTP /call POST Support:** Added JSON body decoding and execution response in `internal/mcp/server.go`.
- **Modern Build Scripts:** Created cross-platform `build.sh` and `start.sh`, non-destructively archived legacy scripts, and sanitized branding.
- **Backend Unit Tests:** Added unit test coverage in `app_core_test.go` for AgentHarness, MCPAggregator, and App server/tray status.

## [1.0.0] - 2026-06-05
### Added
- Complete project rebranding to **TormentNexus**.
- High-performance Go core sidecar (v1.25.0) for PTY and Agent management.
- REST API for agent execution and MCP server aggregation.
- TypeScript bridge for seamless UI-to-Go Core connectivity.
- Unified documentation suite.
