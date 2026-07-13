# TORMENTNEXUS IDEAS & PIVOTS

## 1. Complete Core Migration (Electron to Go Native)
- **Idea**: Entirely replace the Electron frontend with a native Go-based UI (using Fyne or Wails) to further reduce resource footprint.
- **Goal**: Achieve < 50MB idle RAM usage while maintaining full GPU-accelerated terminal rendering.

## 2. Multi-Agent Swarm Orchestration
- **Idea**: Transform the single agent loop into a swarm manager.
- **Workflow**: A "Planner" agent breaks down terminal tasks, "Executor" agents run commands in separate PTY blocks, and a "Reviewer" agent validates outputs.
- **Implementation**: Leverage the Go sidecar to manage multiple PTY sessions concurrently.

## 3. Real-time Log Analytics via LLM
- **Idea**: Pipe PTY output directly into a streaming LLM summarizer.
- **Feature**: As logs scroll by, a side-panel provides real-time explanations of errors or anomalies detected in the stream.

## 4. MCP-to-PTY Bridge
- **Idea**: Allow MCP servers to directly manipulate terminal state.
- **Workflow**: An MCP server providing "filesystem" access can automatically CD the terminal or create files based on AI reasoning without user typing.

## 5. Peer-to-Peer Remote Terminal Sharing
- **Idea**: Use the hardened Go SSH client to facilitate secure, encrypted peer-to-peer terminal sharing for collaborative debugging.
