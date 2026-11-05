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
- **Return to Terminal:** Click **Return to Terminal ⏎** or press the dashboard button again.

### Key Mission Control Capabilities:
1. **Live Subsystem Telemetry:** Monitor real-time status of the Agent Harness (`IDLE` vs `RUNNING`), MCP Hub Server port, count of active tools, number of active pseudo-terminal sessions, and system tray integration.
2. **Autonomous Agent Control Panel:** Start or stop the Think-Act-Observe background agent cycle, perform diagnostic health checks, and dispatch manual instructions.
3. **Model Context Protocol (MCP) Aggregator:** Select any registered tool (`shell_execute`, `file_read`, `file_write`, `agent_status`, etc.), provide a JSON argument object, and click **⚡ Run Tool** to execute immediately.
4. **Terminal Session Orchestration:** View all active shell processes (Shell type, PID, UID), focus on a selected terminal tab, or safely terminate sessions.
5. **Server Lifecycle & System Tray Controls:** Restart the MCP server on `:8080`, stop all background servers, toggle desktop tray icon state, or perform a clean application exit.
6. **Universal Tooltips:** Hover over any `?` marker for contextual guidance.

## Keyboard Shortcuts

- `Ctrl+Shift+D`: Toggle Mission Control Dashboard
- `Ctrl+Shift+T`: New Terminal Tab
- `Ctrl+Shift+W`: Close Current Tab
- `Ctrl+Tab` / `Ctrl+Shift+Tab`: Next / Previous Tab
- `Ctrl+Shift+F`: In-Terminal Search
- `Ctrl+Shift+K`: Clear Active Terminal Buffer
- `Ctrl+,`: Open Configuration Editor
- `F11`: Toggle Fullscreen
