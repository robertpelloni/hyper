# TormentNexus Architectural Memory

- **Project Rebranding:** All instances of 'borg', 'nexus', 'hypervisor', 'aios', 'metamcp', 'claude-mem', 'prism', 'hypercode', and 'hyper' (case-insensitive) must be renamed to 'TormentNexus'.
- **Binary Resolution:** In production, use `resolve(dirname(app.getPath('exe')), 'resources/bin/tormentnexus')`.
- **Sidecar Lifecycle:** Spawning is managed in `app/index.ts`; termination is handled on `window-all-closed`.
- **Multi-Language Architecture:** Expanding from Go/TS to include identical implementations across TypeScript, Rust, Go, C#, and Java.
- **Pi-Mono Integration:** Core Agent features from `pi-mono` are being actively ported into the 5 target languages.
- **Go Version:** Strictly requires Go v1.25.0 as specified in `go.mod`.
- **E2E Testing:** Connectivity verified using `require('electron').net.request` in Playwright tests to probe the Go REST API.
