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
- **Autonomous Agent Think-Act-Observe Workflows:** Autonomous MCP tool invocation and reasoning step streaming (`agent:step`) in real-time.
- **Real-Time MCP Tool Monitor:** Per-tool performance cards tracking average latency, HTTP status codes (`200 OK`), and execution history bar graphs.
- **Enhanced Ergonomics & Keyboard Navigation:** Support for `Esc` dashboard toggle, `Ctrl+Enter` tool execution, and informative inline workflow tips.
- **Client-Side JSON Validation & Formatting:** Real-time syntax checking on tool argument payloads with inline error highlighting, disabled run state on invalid syntax, 'Format JSON', and 'Reset Template' convenience actions.
- **MCP Server Hardening & Structured Errors:** 1MB body limit enforcement on POST `/call` requests (`PAYLOAD_TOO_LARGE` 413), non-empty tool validation (`EMPTY_TOOL_NAME` 400), `TOOL_NOT_FOUND` (404), and `INVALID_ARGUMENTS` (400) structured JSON responses.

## [1.0.0] - 2026-06-05
### Added
- Complete project rebranding to **TormentNexus**.
- High-performance Go core sidecar (v1.25.0) for PTY and Agent management.
- REST API for agent execution and MCP server aggregation.
- TypeScript bridge for seamless UI-to-Go Core connectivity.
- Unified documentation suite.
