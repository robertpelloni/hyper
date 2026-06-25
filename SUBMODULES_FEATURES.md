# SUBMODULES_FEATURES: TormentNexus Integrated Functionalities

## Technical Mapping & Analysis

### Tabby-Go (Go-based Core)
- **PTY Handling**: Advanced terminal management in `tabby-go/pkg/pty` using `creack/pty`. Supports base64 encoding for data transmission and PTY lifecycle management.
- **Remote Protocols**: Comprehensive SSH client in `tabby-go/pkg/ssh` using `golang.org/x/crypto/ssh`. Features include port forwarding, jump hosts, and agent forwarding.
- **AI Integration**: Base client for LLM interaction in `pkg/ai`.
- **Security**: Secret management via `pkg/vault` and `pkg/keychain`.

### Pi-Mono (Go-based Agent Harness)
- **Autonomous Loop**: Primary execution engine in `pkg/agent`.
- **Multi-Model Support**: Anthropic, OpenAI, and Google providers in `pkg/ai`.
- **Task Scheduling**: Structured scheduler for agent actions.
- **Frontends**: TUI (BubbleTea) and CLI implementations.

### Hermes-Agent (Python-based Intelligence)
- **Toolbox**: Extensive library of tools for browser use, code execution, and system interaction.
- **Learning Loop**: Self-improving logic and skill discovery.
- **Memory**: Persistent trajectory and conversation search.

### Warp (Rust-based Terminal)
- **UI Paradigm**: Block-based terminal execution.
- **AI Workflows**: Context-aware command suggestions and shared workflows.

## Implementation Details for Reimplementation

### 1. Agent Harness (`internal/agent`)
- Based on `Pi-Mono`'s `Agent` struct.
- Port the execution loop to support streaming and tool calls.
- Integrate tool registration from `Hermes-Agent` schemas.

### 2. Code Intelligence (`internal/intelligence`)
- Port `Tabby`'s indexing logic.
- Implement code completion handlers using the LLM interface from `Pi-Mono`.

### 3. Terminal & PTY Management (`internal/terminal`)
- Implement `pty.go` using logic from `submodules/tabby/tabby-go/pkg/pty/pty_unix.go`.
- Support PTY resizing and asynchronous data reading with base64 signaling.
- Implement "Block" data structure in Go to track command input/output pairs.
- Store block history in a local database (reusing `BobbyBookmarks` schema).

### 4. Remote Session Management (`internal/session`)
- Port SSH client and connection manager from `submodules/tabby/tabby-go/pkg/ssh/ssh.go`.
- Support multiple sessions per connection and proxy jump chains.

### 5. Tool Registry & MCP (`internal/mcp`)
- Dynamically register Go-based tools and aggregate external MCP servers.
- Use `BobbyBookmarks` as the backend for tool discovery.
