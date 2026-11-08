# ROADMAP: TormentNexus

## Phase 1: Go Core Foundation (Complete)
- [x] PTY management implementation in Go.
- [x] Basic agent harness loop.
- [x] MCP aggregator tool registration.
- [x] Complete project rebranding to TormentNexus.
- [x] Integrated Wails/Go architecture.

## Phase 2: Unified Mission Control & System Services (Complete)
- [x] Consolidated single-page Mission Control dashboard UI.
- [x] Interactive Model Context Protocol (MCP) tool execution runner.
- [x] Live Autonomous Agent Control Panel with command dispatch.
- [x] Server lifecycle management (Start, Stop, Restart on :8080).
- [x] System Tray integration and desktop controls.
- [x] Comprehensive tooltip and guidance system across all UI elements.
- [x] Autonomous Think-Act-Observe reasoning loop with live `agent:step` telemetry.
- [x] Real-time MCP tool performance monitoring (latency, 200 OK status, mini history bar charts).
- [x] Interactive argument templates and "Send to Agent Directive" result piping.
- [x] Robust MCP error handling, client-side real-time syntax checking, and 1MB request limits.
- [x] Interactive MCP Invocation Runner with argument schema auto-population, formatting, and live error recovery callouts.
- [x] Warp-like semantic command block tracking and terminal history search (`internal/terminal/buffer.go`).
- [x] "Explain & Fix" automated error piping from terminal blocks directly into agent reasoning loops.
- [x] Multi-category MCP Tool Registry with category-based filtering and instant search.
- [x] Autonomous reasoning step and semantic command block JSON telemetry export.
- [x] Interactive Terminal Plugins & Themes Hub with category filtering and persistent config management.
- [x] Live Terminal Session Output Tail Inspection with circular buffer history and clipboard export.

## Phase 3: Autonomous Agent Extensions & Multi-Language Swarm (In Progress)
- [ ] Multi-language core parity across 5 languages (TypeScript, Rust, Go, C#, Java).
- [ ] Multi-agent swarm orchestration and collaborative delegation across specialized roles.
- [ ] WASM sandboxed tool runtime for secure arbitrary code execution.
- [ ] Persistent session state replication and SQLite session buffer indexing.
- [ ] External MCP socket server proxying and SSE streaming support.
- [ ] AI code completion layer and inline suggestions.

## Phase 4: Production Deployment & Packaging
- [ ] Multi-platform CI/CD installer generation.
- [ ] Embedded headless PTY integration tests.
- [ ] SSH agent forwarding and remote credential manager.
