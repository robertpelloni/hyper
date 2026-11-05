# TormentNexus Summary

TormentNexus is a unified LLM harness and terminal combining a compiled Go backend (PTY orchestration, agent loop, and MCP server) with an ergonomic web dashboard.

## Key Subsystems

- **Core PTY Engine:** High-performance Go PTY manager based on `creack/pty`, managing concurrent shell sessions.
- **Mission Control Dashboard:** Single-page control center consolidating Autonomous Agent management, MCP tool execution, terminal process oversight, server lifecycle controls, and preferences.
- **MCP Hub & Tool Aggregator:** Embedded HTTP server on `:8080` implementing `/tools` discovery and `/call` execution endpoints conforming to Model Context Protocol standards.
- **Autonomous Agent Harness:** Think-Act-Observe background loop for autonomous coding workflows.
- **Contextual Tooltip Architecture:** Contextual hover guidance across all UI controls and telemetry indicators.

## Project Structure
- `cmd/tormentnexus/`: Entry point for standalone MCP server.
- `internal/`: Core packages for agent, mcp, intelligence, session, terminal, and config.
- `frontend/`: Single-page React/TypeScript UI built with Vite and xterm.js.
- `app_core.go` / `main.go`: Wails runtime integration, server lifecycle, and desktop tray controls.
