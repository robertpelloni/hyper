# TormentNexus Usage Guide

## Getting Started

### 1. Launching TormentNexus
To build and launch the application:
```bash
./build.sh
./bin/tormentnexus
```

To run the standalone MCP Hub server independently:
```bash
./start.sh
# Server starts on http://localhost:8080
```

## Mission Control Dashboard

TormentNexus features a consolidated, singular Mission Control page providing complete visibility and control over all subsystems without page fragmentation.

- **Toggle Mission Control:** Press `Ctrl+Shift+D` or click the **⚡ Dashboard** button in the top header.
- **Return to Terminal:** Click **Return to Terminal ⏎**, press `Esc`, or toggle the dashboard button.

### Key Mission Control Capabilities:
1. **Live Subsystem Telemetry:** Monitor real-time status of the Agent Harness (`IDLE` vs `RUNNING`), MCP Hub Server port, count of active tools, number of active pseudo-terminal sessions, and system tray integration.
2. **Autonomous Agent Control Panel:** Start or stop the Think-Act-Observe background agent cycle, perform diagnostic health checks, execute preset autonomous workflows (`⚡ Scan Sessions`, `⚙ Inspect Config`, `📊 Query Status`), or dispatch freeform directives with live reasoning step telemetry streaming.
3. **Model Context Protocol (MCP) Tool Monitor:** Inspect per-tool performance telemetry with average latency metrics, HTTP status codes (`200 OK`), mini execution bar graphs, and an interactive test harness (with `Ctrl+Enter` execution support).
4. **Terminal Session Orchestration:** View all active shell processes (Shell type, PID, UID), focus on a selected terminal tab, or safely terminate sessions.
5. **Server Lifecycle & System Tray Controls:** Restart the MCP server on `:8080`, stop all background servers, toggle desktop tray icon state, or perform a clean application exit.
6. **Universal Tooltips:** Hover over any `?` marker for contextual guidance and tips across all inputs and telemetry cards.

## Autonomous Agent Workflows (Think-Act-Observe)

The Autonomous Agent Harness operates a structured reasoning loop:
- **THINK:** Analyzes incoming directives, scans available environment resources, and determines optimal actions.
- **ACT:** Invokes registered MCP tools (such as `scan_sessions`, `session_list`, `config_get`, or `shell_execute`) with specific structured arguments.
- **OBSERVE:** Ingests tool execution results, measures elapsed duration, updates internal state, and streams step telemetry via `agent:step` events.

### Preset Workflow Directives:
- `scan_sessions`: Dispatches an autonomous query to inspect all active PTY terminal sessions and tab contexts.
- `check_config`: Inspects current configuration options, terminal font sizing, and shell defaults.
- `status`: Queries the agent harness health and server runtime status.

## Keyboard Shortcuts

- `Ctrl+Shift+D`: Toggle Mission Control Dashboard
- `Esc` (in Dashboard): Return to Active Terminal
- `Ctrl+Enter` (in MCP runner): Execute selected MCP tool
- `Enter` (in Agent directive form): Dispatch directive
- `Ctrl+Shift+T`: New Terminal Tab
- `Ctrl+Shift+W`: Close Current Tab
- `Ctrl+Tab` / `Ctrl+Shift+Tab`: Next / Previous Tab
- `Ctrl+Shift+F`: In-Terminal Search
- `Ctrl+Shift+K`: Clear Active Terminal Buffer
- `Ctrl+,`: Open Configuration Editor
- `F11`: Toggle Fullscreen
