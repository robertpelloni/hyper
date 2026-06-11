# TormentNexus Usage Guide

TormentNexus is a high-performance terminal and autonomous LLM harness built on a hybrid Go/Electron architecture.

## Getting Started

### Installation
1. **Build from source**:
   ```bash
   pnpm install
   pnpm run build
   pnpm run package
   ```
2. **Run the application**:
   - Development: `pnpm run dev` and `pnpm run app` in separate terminals.
   - Production: Execute the binary in `dist/linux-unpacked/tormentnexus`.

## Core Features

### 1. Autonomous Agent (/agent)
You can invoke the autonomous reasoning loop directly from the terminal.
- **Usage**: Type `/agent <your task>` and press Enter.
- **Example**: `/agent find all TODOs in the current directory`
- **Feedback**: A notification will appear while the agent is "thinking," and the result will be streamed back into your terminal buffer.

### 2. Interactive Command Blocks
Inspired by Warp, TormentNexus automatically tracks your commands.
- **Visual Cues**: Successful commands are marked with a green left border. Failed commands are marked with red. Active commands show a yellow border.
- **Metadata**: Each block tracks the execution time and capture of output independently.

### 3. Remote Management (SSH)
TormentNexus includes a hardened Go-based SSH client.
- **Configuration**: Uses standard `~/.ssh/known_hosts` and SSH keys.
- **Security**: Strict host key verification is enforced. If a host key is missing or changed, the connection will fail until the configuration is updated (protecting against MitM attacks).

### 4. Code Completions (Tabby-compatible)
The backend provides sub-millisecond code completions.
- **Protocol**: Compatible with Tabby LSP structures.
- **Integration**: Designed to bridge with local or remote LLM providers for real-time `ghost-text` suggestions.

### 5. MCP Server Aggregator
Manage and list Model Context Protocol servers.
- **API**: Access the local aggregator at `http://127.0.0.1:9876/mcp/servers`.

## Configuration
The configuration file is located at:
- **Linux**: `~/.config/TormentNexus/TormentNexus.json`
- **macOS**: `~/Library/Application Support/TormentNexus/TormentNexus.json`
- **Windows**: `%APPDATA%\TormentNexus\TormentNexus.json`

You can customize themes, plugins, and shell settings just like in the original TormentNexus terminal, but with added fields for agent tuning and sidecar management.
