# TORMENTNEXUS ARCHITECTURAL MEMORY

## Core Hybrid Design
TormentNexus transitions from a pure Electron application to a hybrid Go/Electron architecture. The Go core (the "Sidecar") handles performance-critical operations:
- **PTY Management**: Low-latency terminal stream handling.
- **SSH Protocol**: Secure remote communication using hardened Go libraries.
- **Agent Reasoning**: Autonomous loops that process terminal data and execute multi-step tasks.

## Sidecar Integration
- **Spawning**: The Go binary is managed by the Electron main process lifecycle (`app/index.ts`).
- **Communication**: The frontend communicates with the sidecar via a REST API on `127.0.0.1:9876`.
- **Packaging**: The sidecar binary is bundled in the application's `extraResources` and resolved at runtime based on the environment (dev vs. prod).

## Ported Innovations
- **Warp-style Blocks**: Command boundaries are detected and tracked in the Go core, allowing for granular status reporting and output isolation.
- **Tabby completions**: LSP-compatible data structures in Go enable sub-millisecond ghost-text suggestions.
- **Wave SSH**: Security is prioritized via strict `knownhosts` verification and support for modern SSH key types.

## Identity & Branding
- **Project Name**: TormentNexus (PascalCase).
- **Configuration**: Standardized paths in `~/.config/TormentNexus/`.
- **Environment**: Go 1.23.0 compatibility enforced for broad system support.
