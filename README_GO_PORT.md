# TormentNexus - Go Native Port

> The definitive AI-powered terminal, rebuilt as a **single native Go binary**. No Electron. No Node.js. Just Go + WebView.

## What Changed

The entire Electron + Node.js runtime has been replaced with a **pure Go backend** using [Wails v2](https://wails.io/). The React/xterm.js frontend is embedded directly into the binary.

### Architecture

| Component | Before (Electron) | After (Go Native) |
|---|---|---|
| **Runtime** | Electron 22 + Chromium | Go + WebView2 (Windows) |
| **Backend** | Node.js (app/index.ts) | Go (app_core.go, session.go, config.go) |
| **PTY** | node-pty (native addon) | creack/pty (pure Go) |
| **IPC** | Electron ipcMain/ipcRenderer | Wails bindings (auto-generated) |
| **Config** | JS/JSON via Node.js | Go JSON with fsnotify hot-reload |
| **Agent** | Go sidecar (REST :9876) | Native Go AgentHarness (in-process) |
| **MCP** | Go sidecar (REST :9876) | Native Go MCPAggregator (in-process) |
| **SSH** | node-pty + tabby-go | Go crypto/ssh (session/remote.go) |
| **Binary Size** | ~200MB+ (Electron bundle) | ~12MB (single exe) |
| **Startup** | 3-5 seconds | <1 second |
| **RAM Usage** | 300-500MB+ | 30-80MB |

## Features (All Preserved)

- ✅ **Multiple Tab Sessions** - Create, switch, close terminal tabs (Ctrl+Shift+T/W)
- ✅ **xterm.js Terminal** - Full xterm.js with canvas/WebGL renderer
- ✅ **Full Terminal Emulation** - 256-color, Unicode 11, ligatures, image support
- ✅ **Session Management** - PTY spawn, resize, write, close
- ✅ **Split Panes** - Horizontal/vertical splits (Ctrl+Shift+D/E)
- ✅ **Search** - Find text in terminal buffer (Ctrl+Shift+F)
- ✅ **Copy/Paste** - Ctrl+Shift+C/V, right-click paste, copy-on-select
- ✅ **Config System** - JSON config with hot-reload via fsnotify
- ✅ **Font Sizing** - Zoom in/out/reset (Ctrl+=/Ctrl+-/Ctrl+0)
- ✅ **Window Controls** - Minimize, maximize, fullscreen, close
- ✅ **Hamburger Menu** - Alt+F for quick menu access
- ✅ **Agent Harness** - Autonomous agent execution loop (in-process)
- ✅ **MCP Aggregator** - Model Context Protocol tool registry (in-process)
- ✅ **SSH Remote Sessions** - crypto/ssh client with jump hosts
- ✅ **Notifications** - System notifications with auto-dismiss
- ✅ **Status Bar** - Session count, agent status, version info
- ✅ **Keyboard Shortcuts** - Full keymap matching original TormentNexus
- ✅ **Profiles** - Multiple shell profiles support
- ✅ **Web Links** - Clickable URLs in terminal output

## Build & Run

### Prerequisites

- **Go** v1.25.0+
- **Node.js** v18+
- **Wails CLI** v2: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Quick Build

```bash
wails build
```

Output: `build/bin/tormentnexus.exe`

### Development Mode

```bash
wails dev
```

Opens the app with hot-reload for both Go and frontend changes.

### Manual Build

```bash
# 1. Build frontend
cd frontend && npm install && npm run build && cd ..

# 2. Generate Wails bindings
wails generate module

# 3. Build Go binary
go build -ldflags "-s -w" -o tormentnexus.exe .
```

### One-Click Build (Windows)

```cmd
build.bat
```

## Project Structure

```
tormentnexus/
├── main.go              # Wails app entry point + window config
├── app_core.go          # App struct, window controls, system ops
├── session.go           # PTY session manager (creack/pty)
├── config.go            # Config manager with hot-reload (fsnotify)
├── agent.go             # Agent harness (autonomous loop)
├── mcp.go               # MCP aggregator (tool registry)
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app with state management
│   │   ├── api.ts            # Wails binding bridge
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── Header.tsx    # Tab bar + window controls
│   │   │   ├── Terms.tsx     # Terminal container
│   │   │   ├── Term.tsx      # xterm.js wrapper
│   │   │   ├── SplitPane.tsx # Resizable split panes
│   │   │   ├── StatusBar.tsx # Bottom status bar
│   │   │   └── Notifications.tsx
│   │   └── styles/
│   │       └── global.css    # Full TormentNexus theme
│   ├── wailsjs/         # Auto-generated Wails bindings
│   └── dist/            # Built frontend (embedded in Go binary)
├── internal/            # Original Go internal packages
│   ├── terminal/        # PTY management + buffer
│   ├── session/         # Session + SSH remote manager
│   ├── agent/           # Agent harness core
│   ├── config/          # Config types
│   ├── mcp/             # MCP server + aggregator
│   └── intelligence/    # Code indexer
├── cmd/tormentnexus/    # Legacy MCP server (still works standalone)
├── wails.json           # Wails project config
├── go.mod / go.sum      # Go dependencies
└── build.bat            # One-click build script
```

## Configuration

Config file: `%APPDATA%\TormentNexus\TormentNexus.json`

Default config matches the original TormentNexus defaults exactly. Open with `Ctrl+,` or the hamburger menu.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+Shift+T | New Tab |
| Ctrl+Shift+W | Close Tab |
| Ctrl+Tab | Next Tab |
| Ctrl+Shift+Tab | Previous Tab |
| Ctrl+Shift+D | Split Right |
| Ctrl+Shift+E | Split Down |
| Ctrl+Shift+F | Search |
| Ctrl+Shift+C | Copy |
| Ctrl+Shift+V | Paste |
| Ctrl+Shift+K | Clear Buffer |
| Ctrl+= | Zoom In |
| Ctrl+- | Zoom Out |
| Ctrl+0 | Reset Zoom |
| Ctrl+, | Preferences |
| Alt+F | Hamburger Menu |
| F11 | Fullscreen |
| Ctrl+Shift+Q | Quit |

## Agent & MCP

The Agent Harness and MCP Aggregator now run **in-process** (no sidecar needed):

```javascript
// From frontend via Wails bindings:
import { agentExecuteCommand, agentHealthCheck } from './api';
import { mcpListTools, mcpCallTool } from './api';

// Check agent health
const status = await agentHealthCheck();

// List MCP tools
const tools = await mcpListTools();

// Call an MCP tool
const result = await mcpCallTool('shell_execute', { command: 'ls' });
```

## Why This Is Better

1. **12MB vs 200MB+** - No bundled Chromium
2. **Instant startup** - No Electron boot sequence
3. **Native performance** - Go PTY, no node-pty native addon headaches
4. **Single file** - Just `tormentnexus.exe`, nothing else needed
5. **In-process agent** - No REST sidecar overhead
6. **Lower RAM** - 30-80MB vs 300-500MB+
7. **No build complexity** - `wails build` produces the exe directly
8. **Hot-reload config** - Go fsnotify watches config file for changes
9. **Cross-platform ready** - Wails supports Windows, macOS, Linux
