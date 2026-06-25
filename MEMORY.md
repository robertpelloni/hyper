# TormentNexus Architectural Memory

- **Project Rebranding:** All instances of 'borg', 'nexus', 'hypervisor', 'aios', 'metamcp', 'claude-mem', 'prism', 'hypercode', and 'hyper' (case-insensitive) must be renamed to 'TormentNexus'.
- **Binary Resolution:** In production, use `resolve(dirname(app.getPath('exe')), 'resources/bin/tormentnexus')`.
- **Sidecar Lifecycle:** Spawning is managed in `app/index.ts`; termination is handled on `window-all-closed`.
- **Go Version:** Strictly requires Go v1.25.0 as specified in `go.mod`.
- **E2E Testing:** Connectivity verified using `require('electron').net.request` in Playwright tests to probe the Go REST API.
