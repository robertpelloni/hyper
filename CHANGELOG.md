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
- **Structured Error Recovery Callouts:** Added visual error callout boxes with dedicated `errorCode` badge, "📋 Copy Error", and "🔄 Reset & Retry" controls.
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
- **Live Terminal Session Output Tail Inspection:** Added real-time terminal buffer inspection in Section 3 ("Terminal Session Orchestration") of the Mission Control dashboard, featuring output stream tailing, Hide/Show toggle, Copy action, and Go backend ring buffer support (`GetSessionOutput`).
- **Expanded MCP Tool Registry & Category Classification:** Added `workspace_search` (Intelligence), `git_status` (System), and `system_info` (System) tools with structured categories (`System`, `Filesystem`, `Agent`, `Intelligence`).
- **Category Filtering & Preset Dispatch:** Added interactive category filter pills in the MCP Tool Monitor and one-click quick presets (`Git Status`, `Find 'main'`) in the Autonomous Agent Control Panel.
- **JSON Telemetry & Block Export:** Added JSON export utilities for cognitive reasoning step traces (`Export Steps`) and semantic command block logs (`Export Blocks`).
- **Automated Testing:** 100% test pass rate across all Go packages (`tormentnexus`, `internal/agent`, `internal/config`, `internal/intelligence`, `internal/mcp`, `internal/session`, `internal/terminal`), including workspace indexing and git status tool tests.
- **Cross-Platform Scripts:** Added executable `build.sh` and `start.sh` runners; non-destructively archived legacy scripts in `archive/start.bat.bak`.

### Changed
- Rebranded remaining references across the codebase to TormentNexus.
- Synchronized all documentation files to v1.1.0 (`VERSION.md`, `DEPLOY.md`, `MEMORY.md`, `ROADMAP.md`, `TODO.md`, `VISION.md`, `README.md`, `USAGE.md`, `SUMMARY.md`, `HANDOFF.md`).

## [1.0.0] - 2026-11-04

### Added
- Initial rebranding of hyper to TormentNexus.
- Basic terminal architecture and Go core backend.
- Embedded Wails UI integration.
