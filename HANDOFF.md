# TormentNexus v1.0.0: Release and Handoff

## Release Summary
TormentNexus v1.0.0 is the foundational release of the hybrid Go/Electron autonomous LLM harness. The architecture is stable, verified, and benchmarked.

## Technical Context
- **Sidecar:** Go core listens on 127.0.0.1:9876.
- **Interception:** '/agent ' commands are intercepted in 'app/index.ts' and processed by 'app/utils/agent-interceptor.ts'.
- **Testing:** Playwright E2E tests confirm connectivity and basic agent feedback loop.
- **Go Core:** Modules for PTY, Agent, MCP, and Session are located in 'internal/'.

## Instructions for Successor
1. Start with Phase 2 items in ROADMAP.md.
2. The Go Core is ready for gRPC implementation to replace/supplement REST.
3. Feature parity with Warp and Tabby should be the primary focus for the next major milestone.
