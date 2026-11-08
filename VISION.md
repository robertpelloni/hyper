# VISION: TormentNexus - The Ultimate LLM Harness

TormentNexus is a high-performance terminal, MCP hub, and autonomous agent harness built with a Go-based core and an ergonomic desktop frontend. Our mission is to integrate the most powerful primitives of modern agentic workflows into a singular, cohesive developer workstation.

## Core Foundational Concepts

### 1. Unified Mission Control Architecture
Rather than fragmenting developer tooling across hidden tabs and disparate subpages, TormentNexus consolidates high-frequency operations into a singular, prioritized control dashboard:
- **Telemetry Banner:** Real-time visibility into agent state, MCP port listeners, active tool counts, and PTY sessions.
- **Autonomous Agent Harness:** Direct access to Think-Act-Observe loops with dispatch controls and streaming event feeds.
- **MCP Aggregator & Tool Runner:** Immediate interactive execution and discovery of local and remote tools.
- **Terminal Session Manager:** Seamless orchestration of concurrent pseudo-terminals.
- **Server Lifecycle & System Tray:** Complete control to restart, inspect, or cleanly terminate all background servers.

### 2. High-Performance Go Core
Critical backend operations—PTY management, HTTP servers, MCP routing, and process supervision—are executed by the compiled Go core, ensuring high performance, instant startup, and zero UI stuttering.

### 3. Interactive MCP Invocation & Dynamic Result Piping
Rather than treating Model Context Protocol (MCP) tools as opaque background endpoints, TormentNexus exposes first-class interactive tooling directly within the Mission Control interface:
- **Instant Discovery & Templating:** Tool cards automatically generate editable JSON argument skeletons based on registered schema parameters.
- **Client-Side Syntax Validation:** Real-time JSON validation prevents malformed execution payloads before they reach the backend Go core.
- **Bi-Directional Result Piping:** Outputs from manual tool runs or terminal command blocks can be piped directly into autonomous agent directives via a single click ("Send to Agent Directive" / "Explain & Fix"), creating seamless human-in-the-loop workflows.
- **Hardened Execution Pipeline:** Backend `/call` endpoints enforce strict 1MB body bounds and structured error reporting (`PAYLOAD_TOO_LARGE`, `INVALID_ARGUMENTS`, `TOOL_NOT_FOUND`).

### 4. Warp-Style Semantic Command Blocks
TormentNexus elevates traditional continuous terminal scrollback into discrete semantic command blocks. Each executed command is tracked with its duration, exit status badge, and isolated output stream, empowering developers to search execution history and trigger targeted AI diagnostic workflows on demand.

### 5. Contextual Usability & Tooltips
Every UI element provides embedded, accessible tooltips and explanatory markers, ensuring that whether developers are executing complex agent chains or configuring PTY parameters, guidance is always accessible.
