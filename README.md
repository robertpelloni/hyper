# TormentNexus

TormentNexus is the **Ultimate LLM Harness**—a high-performance, hybrid terminal built on Go and Electron. It extends the foundations of the modern terminal with autonomous AI capabilities, interactive command blocks, and hardened remote session management.

## Key Features

- **Autonomous Agent**: Integrated reasoning loop accessible via `/agent` for multi-step tasks.
- **Command Blocks**: Visual status tracking and output isolation for every terminal command (Warp-style).
- **Hardened SSH**: Secure remote management with strict host key verification and local port forwarding.
- **LSP Proxy**: sub-millisecond code completions and IDE features bridged to LLM backends.
- **Hybrid Performance**: PTY management and core logic handled by a dedicated Go sidecar for maximum throughput.

## Documentation

- [**Usage Guide**](USAGE.md): How to use the agent, command blocks, and remote features.
- [**Deployment Guide**](DEPLOY.md): Prerequisites and build instructions.
- [**Performance Report**](PERFORMANCE.md): Latency benchmarks and architectural benefits.
- [**Roadmap**](ROADMAP.md): Future phases of development.
- [**Vision**](VISION.md): The long-term goal of the project.

## Quick Start

### Build & Run
```bash
pnpm install
pnpm run build
pnpm run dist
./dist/linux-unpacked/tormentnexus
```

## Community & Plugins
TormentNexus maintains full compatibility with the existing Hyper plugin ecosystem while introducing the Model Context Protocol (MCP) for advanced tool aggregation.

---
*Powered by TormentNexus Team*
