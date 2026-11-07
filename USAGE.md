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
- **Interactive Quick-Start Onboarding Guide:** Accessible at the top of Mission Control (or via the **📖 Quick-Start Guide** header button if dismissed). Each card is clickable with visual tour guidance:
  1. **Step 1 (Agent Presets):** Click to pre-fill and focus the directive prompt (`scan_sessions`), then press `Enter` to observe real-time Think-Act-Observe telemetry streaming.
  2. **Step 2 (MCP Tool Invocation):** Click to select a registered tool (`session_list`, `shell_execute`), pre-populate sample JSON arguments, and press `Ctrl+Enter` to run.
  3. **Step 3 (Autonomous Result Piping):** Click to pipe any tool output directly into the agent directive field for LLM evaluation and multi-step action.

### Key Mission Control Capabilities:
1. **Live Subsystem Telemetry:** Monitor real-time status of the Agent Harness (`IDLE` vs `RUNNING`), MCP Hub Server port, count of active tools, number of active pseudo-terminal sessions, and system tray integration.
2. **Autonomous Agent Control Panel:**
   - **Real-Time Status Indicator:** Displays pulsating real-time status (`● RUNNING` in emerald green or `○ IDLE` in muted grey).
   - **Preset Autonomous Workflows:** One-click shortcuts for `⚡ Scan Sessions`, `⚙ Inspect Config`, and `📊 Query Status`.
   - **Think-Act-Observe Step Feed:** Streams color-coded reasoning step badges (`PLAN` in indigo, `THINK` in purple, `ACT` in blue, `OBSERVE` in green, `REFLECT` in amber) with per-step latency and tool identifiers.
   - **Autonomous Task Queue:** Queue sequential directives via the **➕ Queue Task** action. Review pending tasks as badges and remove individual items on demand with the inline `✕` button or clear all with **Clear Queue**.
3. **Model Context Protocol (MCP) Tool Monitor:** Inspect per-tool performance telemetry with average latency metrics, HTTP status codes (`200 OK`), mini execution bar graphs, and an interactive test harness:
   - **Real-Time Search & Filtering:** Search tools by name or description using the live search filter box.
   - **Status Tabs:** Filter the tool list by status: **All**, **Success** (`200 OK`), or **Error** (`500 / 4xx`).
   - **One-Click Argument Templates:** Selecting a tool card automatically pre-populates a valid, editable JSON argument template with inline description hints.
   - **Client-Side Syntax Validation:** Real-time JSON validation with red border highlighting and actionable error alerts when syntax is invalid.
   - **Utility Actions:** **✨ Format JSON** to clean indentation and **↺ Reset Template** to restore default parameters.
   - **Structured Error Recovery:** If an invocation fails or returns an error (such as `TOOL_NOT_FOUND`, `INVALID_ARGUMENTS`, or `PAYLOAD_TOO_LARGE`), a structured error callout appears displaying the error code badge, with one-click **📋 Copy Error** and **🔄 Reset & Retry** controls.
   - **Interactive Piping:** Use the **🤖 Send to Agent Directive** button to forward invocation results directly into the Autonomous Agent harness for automated analysis.
4. **Terminal Session Orchestration:** View all active shell processes (Shell type, PID, UID), focus on a selected terminal tab, or safely terminate sessions.
5. **Server Lifecycle & System Tray Controls:** Restart the MCP server on `:8080`, stop all background servers, toggle desktop tray icon state, or perform a clean application exit.
6. **Universal Tooltips:** Hover over any `?` marker for contextual guidance and tips across all inputs and telemetry cards.
7. **Quick-Access Shortcuts Footer:** At the bottom of Mission Control, access the persistent keyboard shortcuts bar:
   - `Esc`: Return to Shell
   - `Ctrl+Shift+D`: Toggle Dashboard
   - `Ctrl+Enter`: Run Selected Tool
   - `Enter`: Dispatch Agent Directive

## Autonomous Agent Workflows (Multi-Phase Reasoning)

The Autonomous Agent Harness operates a structured 5-phase cognitive loop:
- **PLAN:** Synthesizes high-level strategy and objective decomposition.
- **THINK:** Analyzes environmental context, registered MCP tools, and argument parameters.
- **ACT:** Dispatches execution to the target tool (`shell_execute`, `session_list`, `config_get`, etc.).
- **OBSERVE:** Ingests output payload, computes duration, and checks output validity.
- **REFLECT:** Confirms goal resolution and evaluates whether follow-up tasks are required.

### Preset Workflow Directives:
- `scan_sessions`: Dispatches an autonomous query to inspect all active PTY terminal sessions and tab contexts.
- `check_config`: Inspects current configuration options, terminal font sizing, and shell defaults.
- `status`: Queries the agent harness health and server runtime status.

## Advanced Features & Tool Piping

### 1. Interactive Tool Result Piping
You can chain MCP tool execution results directly into the Autonomous Agent loop. After executing any tool in the MCP Tool Monitor, click **🤖 Send to Agent Directive** in the output panel. This automatically populates the agent directive with the tool output, prompting the LLM harness to analyze, format, or take autonomous follow-up actions.

### 2. MCP Tool Validation & Error Handling
To prevent invalid tool invocations and provide robust error handling:
- **Client-Side Real-Time Syntax Validation:** As you edit JSON arguments in Mission Control, syntax is validated in real time. If a syntax error is introduced (e.g. missing comma or unclosed brace), the input highlights in red and displays an explanatory warning box with the parser error. The **⚡ Run Tool** button is disabled until valid JSON is restored.
- **✨ Format JSON Utility:** Automatically formats and indents the JSON arguments for readability.
- **↺ Reset Template Utility:** Instantly restores the default argument schema for the currently selected tool.
- **Execution Safety Timeout:** Client-side tool invocations include a 15-second timeout guard to prevent UI lockup in the event of unresponsive external tools.

### 3. Standalone MCP Server Execution & API Reference
The Go core backend can be run as a lightweight standalone Model Context Protocol server over HTTP:
```bash
./start.sh
# Server starts on http://localhost:8080
```

#### Available Endpoints:
- `GET http://localhost:8080/tools`: Returns JSON array of all registered MCP tools and schemas.
- `POST http://localhost:8080/call`: Executes a tool with structured JSON payload:
  ```json
  {
    "name": "shell_execute",
    "arguments": {
      "command": "echo Hello from TormentNexus"
    }
  }
  ```
- `GET http://localhost:8080/history`: Returns execution metrics (capped at the last 100 calls) including duration in milliseconds and HTTP status codes.

#### Structured Error Codes & HTTP Status:
The Go MCP backend enforces rigorous validation and returns structured JSON error responses:
| HTTP Status | Error Code | Description |
|:---|:---|:---|
| **413 Request Entity Too Large** | `PAYLOAD_TOO_LARGE` | Incoming request payload exceeds the 1MB safety limit. |
| **400 Bad Request** | `INVALID_ARGUMENTS` | Payload body is malformed or invalid JSON. |
| **400 Bad Request** | `EMPTY_TOOL_NAME` | The `name` field in the request was empty or omitted. |
| **404 Not Found** | `TOOL_NOT_FOUND` | The requested tool name is not registered in the MCP Hub. |

Example Error Response:
```json
{
  "error": "Tool not found",
  "errorCode": "TOOL_NOT_FOUND",
  "statusCode": 404,
  "status": "failed",
  "tool": "unknown_tool"
}
```

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
