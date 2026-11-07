# TormentNexus: Deployment and Operations Guide

## Prerequisites
- **Go:** v1.25.0+ (standard compiler)
- **Node.js:** v18+ (LTS or newer)
- **npm / pnpm:** Package manager

## Building TormentNexus

### 1. Unified Automated Build (Recommended)
On Linux/macOS:
```bash
./build.sh
```
On Windows:
```cmd
build.bat
```

This compiles frontend assets with Vite, embeds them into the Go binary, and compiles the Go core (`bin/tormentnexus`) along with the standalone MCP server (`bin/tormentnexus-mcp`).

### 2. Manual Step-by-Step Build
```bash
# Frontend
cd frontend
npm install
npm run build
cd ..

# Go Core Backend & MCP Server
go build -o bin/tormentnexus .
go build -o bin/tormentnexus-mcp ./cmd/tormentnexus
```

## Running TormentNexus
```bash
# Launch Standalone MCP Server on :8080
./start.sh
# (or start.bat on Windows)

# Launch Full TormentNexus Application
./bin/tormentnexus
```

## System Tray & Server Control
- **Mission Control UI:** Click the `⚡ Dashboard` button in the header or `Ctrl+Shift+D` to open Mission Control.
- **Server Shutdown:** Use the "Stop All Servers" or "Clean Shutdown & Exit" buttons in Mission Control, or the desktop application menu.
- **HTTP Endpoints:**
  - `GET http://localhost:8080/tools` - List registered MCP tools.
  - `POST http://localhost:8080/call` - Execute a tool with `{ "name": "...", "arguments": { ... } }`.
  - `GET http://localhost:8080/history` - Retrieve execution history buffer and latency metrics.

## Onboarding & First-Run Diagnostics
On initial launch, Mission Control displays the interactive **Quick-Start & Onboarding Guide** banner. Users can verify their environment in three automated steps:
1. Verify MCP Server connectivity and telemetry on port 8080.
2. Run baseline tool executions (`session_list`, `config_get`, `scan_sessions`) and observe response latency.
3. Test autonomous Think-Act-Observe workflows using preconfigured agent presets.

The guide banner can be dismissed at any time or reopened via the `📖 Quick-Start Guide` button in the header. Each step card within the banner is interactive: clicking a step pre-configures presets, tool selections, or result piping directly in the UI with instant visual feedback.
