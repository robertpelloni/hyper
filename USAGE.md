# TormentNexus: Usage Guide

## Getting Started

TormentNexus is more than just a terminal. It's an AI-integrated environment.

### 1. Launching
After installing or building, launch the application. You will see a familiar terminal interface, but with enhanced capabilities.

### 2. Autonomous Agent (Agentic Mode)
TormentNexus features a built-in autonomous loop. To trigger agent actions:
- Use the command palette (Cmd/Ctrl + Shift + P) and search for "Agent: Execute".
- Or use the Go Core REST API directly for automation:
  ```bash
  curl -X POST http://localhost:9876/agent/execute -d '{"command": "summarize this directory"}'
  ```

### 3. MCP (Model Context Protocol)
TormentNexus acts as an MCP Aggregator. You can connect various MCP servers to provide the terminal with extra tools (e.g., file system access, database querying).
- List active MCP servers:
  ```bash
  curl http://localhost:9876/mcp/servers
  ```

### 4. Interactive Command Blocks
Inspired by Warp, TormentNexus organizes output into logical blocks.
- Each block has its own context.
- You can copy, share, or ask the AI about a specific block's output.

### 5. Configuration
Configuration is managed via `TormentNexus.json`.
- Located at: `~/.config/TormentNexus/TormentNexus.json` (Linux/macOS)
- You can customize themes, keymaps, and Go core settings here.

## Tips and Tricks
- Use `ssh://` links to open remote sessions managed by the Go core's secure SSH module.
- Check the status bar for real-time AI processing indicators.
