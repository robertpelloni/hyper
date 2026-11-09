# Changelog

All notable changes to TormentNexus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-07

### Added
- **Consolidated Mission Control Dashboard:** Redesigned `Dashboard.tsx` into a singular, high-value page consolidating agent control, MCP tool runner, terminal session list, server lifecycle controls, and preferences without page fragmentation.
- **Universal Tooltips & Interactive Guidance:** Added `Tooltip.tsx` markers (`?`) across all dashboard metrics, form fields, and actions.
- **Quick-Start Onboarding Guide:** Added an interactive 3-step banner with pre-filling actions for agent directives, tool runner arguments, and result piping.
- **MCP HTTP Server Hardening:** Implemented `POST /call` and `GET /history` in `internal/mcp/server.go` with 1MB payload limits (`http.MaxBytesReader`) and structured error responses (`PAYLOAD_TOO_LARGE`, `INVALID_ARGUMENTS`, `EMPTY_TOOL_NAME`, `TOOL_NOT_FOUND`).
- **Real-Time Client-Side Validation:** Added real-time JSON syntax checking, red border error states, Format JSON, and Reset Template utilities in Mission Control.
- **Interactive Tool Parameter Schemas & Quick-Fill Helper:** Enforced required and optional argument schemas across all MCP tools (`shell_execute`, `agent_status`, `file_read`, `file_write`, `session_list`, `workspace_search`, `git_status`, `system_info`) in backend and UI, featuring interactive clickable badges to insert parameter snippets with one click.
- **Live Tool Execution Timer & Retry Tracking:** Added microsecond-precision live execution timers (`⏱ Xms`) and sequential retry attempt counters (`Retries: N`) on tool runner invocations.
- **Structured Error Recovery & Actionable Remediation:** Added backend enforcement returning `MISSING_REQUIRED_ARG` with specific actionable remediation instructions (`💡 Remediation: ...`), visual status badges (`200 OK` vs error codes), and one-click "🔄 Retry" and "📋 Copy Error" controls.
- **MCP Execution History Clearing & Re-run Step Actions:** Added `DELETE /history` endpoint and `ClearHistory()` method in Go backend, interactive "Clear History" button in MCP Tool Monitor, and one-click "🔄 Re-run" directive buttons on agent reasoning steps in Mission Control.
- **Dynamic Category Count Badges & Color-Coded Latency Indicators:** Added dynamic count badges to category filter pills (`ALL (8)`, `System (4)`, `Filesystem (2)`, `Agent (1)`, `Intelligence (1)`) in MCP Tool Monitor and categorized latency color indicators (emerald green for <25ms, sky blue for <100ms, amber for <250ms, rose for >=250ms).
- **Tool Arguments Quick-Clear & Filter Reset Empty State:** Added an interactive `🗑 Clear` button to reset tool arguments instantly to `{}` in the Tool Runner editor, keyboard selection (`Enter`/`Space`) for tool cards, and an empty state card with a one-click `Reset Filters` action when search or category filters yield no matching tools.
- **Standalone MCP Server Tool Catalog Parity:** Synchronized standalone HTTP MCP server in `cmd/tormentnexus/main.go` to register all 8 standard tools with category tags, required argument schema validation, and structured error responses. Added end-to-end integration test suite `cmd/tormentnexus/main_test.go`.
- **Remote SSH Protocol & Session Orchestration:** Ported remote SSH session capabilities inspired by Tabby-Go into `internal/session/ssh.go` using `golang.org/x/crypto/ssh`. Added interactive remote SSH connection form and `LOCAL` vs `SSH` session badges in Section 3 of `Dashboard.tsx`.
- **Automated Playwright MCP UX Test Suite:** Added comprehensive automated end-to-end browser test script `test/test_dashboard_mcp_flow.py` covering tool discovery, category filtering, schema quick-fill badges, client-side JSON syntax errors, quick-clear arguments, execution timing, result piping, and remote SSH modals.
- **MCP Tool Search & Status Filtering:** Added search filtering by tool name/description and status tabs (All, Success, Error).
- **Multi-Phase Agent Reasoning Engine:** Extended `AgentHarness` (`agent.go`) and `Agent` (`internal/agent/harness.go`) to support multi-phase reasoning steps (`PLAN`, `THINK`, `ACT`, `OBSERVE`, `REFLECT`), step callbacks, and sequential task queueing.
- **Inline Task Removal & Agent Status Indicator:** Added inline task deletion (`✕`) for queue badges and pulsating real-time status indicator (`● RUNNING` / `○ IDLE`).
- **Quick-Access Shortcuts Footer:** Added persistent keyboard shortcuts bar (`Esc`, `Ctrl+Shift+D`, `Ctrl+Enter`, `Enter`) and inline tool description hints.
- **Session Manager Lifecycle:** Added thread-safe `ListSessions()`, `Count()`, and `CloseAll()` methods to `internal/session/manager.go` with unit test suite.
- **In-Memory File Indexing & Search:** Added directory walking, in-memory text indexing, and case-insensitive keyword search in `internal/intelligence/indexer.go`.
- **System Tray & Server Lifecycle Management:** Added `StartMCPServer`, `StopMCPServer`, `RestartServers`, `StopServers`, `GetServerStatus`, `ToggleSystemTray`, and `QuitApp` in `app_core.go` and `main.go`.
- **Terminal Command History & Search:** Implemented thread-safe `SearchBlocks` and history recording in `internal/terminal/buffer.go` with Wails bindings in `app_core.go`.
- **Accessible Keyboard Tooltips:** Added full keyboard focus, ARIA attributes, and Escape key dismissal with placement indicator arrow in `Tooltip.tsx`.
- **Dynamic Parameterized Agent Directives:** Added prefix-based tool directive routing (`file_read:`, `shell_execute:`) in `AgentHarness` and cognitive phase filtering pills (`ALL`, `PLAN`, `THINK`, `ACT`, `OBSERVE`, `REFLECT`) in Mission Control.
- **Warp-Style Semantic Command Blocks & Explain in UI:** Added interactive command block history inspector in Section 3 ("Terminal Session Orchestration") with execution status badges (`✓` / `✕`), search filtering, and one-click "🤖 Explain & Fix" button piping terminal command outputs into agent directives.
- **Terminal Plugins & Themes Hub:** Integrated a dedicated plugin management hub in Section 5 of the Mission Control dashboard with category filtering (`ALL`, `Theme`, `Productivity`, `Navigation`, `Visuals`), install/status badges, GitHub resource links, and configuration persistence via Go core `ConfigManager`.
- **Enhanced Quick-Start Onboarding Guide:** Expanded the onboarding banner to a 5-step interactive journey with real-time completion progress tracking (`X/5 Completed`), visual checkmarks (`✓`), and clickable pre-fill shortcuts for Agent pipelines, MCP tool invocation, autonomous result piping, Command Blocks & Snapshot state, and Plugin personalization.
- **Live Terminal Session Output Tail Inspection:** Added real-time terminal buffer inspection in Section 3 ("Terminal Session Orchestration") of the Mission Control dashboard, featuring output stream tailing, Hide/Show toggle, Copy action, and Go backend ring buffer support (`GetSessionOutput`).
- **Expanded MCP Tool Registry & Category Classification:** Added `workspace_search` (Intelligence), `git_status` (System), and `system_info` (System) tools with structured categories (`System`, `Filesystem`, `Agent`, `Intelligence`).
- **Category Filtering & Preset Dispatch:** Added interactive category filter pills in the MCP Tool Monitor and one-click quick presets (`Git Status`, `Find 'main'`) in the Autonomous Agent Control Panel.
- **JSON Telemetry & Block Export:** Added JSON export utilities for cognitive reasoning step traces (`Export Steps`) and semantic command block logs (`Export Blocks`).
- **Streamlined Autonomous Agent Workflows:** Added interactive "⚡ Pipe to Agent" direct invocation buttons on each MCP Tool performance card, "🔗 Pipeline: Audit" chained workflow preset, and "🔧 Inspect Tool" inspection shortcuts on reasoning steps in `Dashboard.tsx`.
- **Chained Directive Pipelines:** Enhanced `AgentHarness` in `agent.go` to support chained autonomous directive pipelines separated by `&&` (e.g., `git_status && system_info`).
- **Session Snapshot Export & Persistent State:** Implemented thread-safe session metadata and snapshot persistence (`SessionMetadata`, `SessionSnapshot`, `ExportSnapshot()`, `SaveSnapshotToFile()`, `LoadSnapshotFromFile()`) in `internal/session/manager.go` and exposed via Go backend method `ExportSessionSnapshot()` in `app_core.go` and `session.go`. Added interactive "💾 Snapshot Sessions" button in Section 3 ("Terminal Session Orchestration") of `Dashboard.tsx` with toast confirmation and automated JSON export.
- **Automated Testing:** 100% test pass rate across all Go packages (`tormentnexus`, `internal/agent`, `internal/config`, `internal/intelligence`, `internal/mcp`, `internal/session`, `internal/terminal`), including workspace indexing, git status tools, session snapshot persistence, and chained directive execution.
- **Cross-Platform Scripts:** Added executable `build.sh` and `start.sh` runners; non-destructively archived legacy scripts in `archive/start.bat.bak`.

### Changed
- Rebranded remaining references across the codebase to TormentNexus.
- Synchronized all documentation files to v1.1.0 (`VERSION.md`, `DEPLOY.md`, `MEMORY.md`, `ROADMAP.md`, `TODO.md`, `VISION.md`, `README.md`, `USAGE.md`, `SUMMARY.md`, `HANDOFF.md`).

## [1.0.0] - 2026-11-04

### Added
- Initial rebranding of hyper to TormentNexus.
- Basic terminal architecture and Go core backend.
- Embedded Wails UI integration.
