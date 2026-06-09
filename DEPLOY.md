# TormentNexus v1.0.0: Deployment and Release Guide

## System Overview
TormentNexus is a hybrid Go/Electron terminal application. The Go core acts as a high-performance sidecar managing PTY sessions and autonomous agent logic.

## Prerequisites
- **Go:** v1.23.0+ (Tested with v1.25.0 in dev environment)
- **Node.js:** v18.x (LTS)
- **Yarn:** v1.22+
- **Platform:** Linux, Windows, macOS (x64/ARM64)

## Production Build and Packaging

1. **Clean and Install:**
   ```bash
   yarn install --ignore-engines
   ```

2. **Full Rebuild:**
   ```bash
   yarn run build
   ```
   *Note: This automatically compiles the Go sidecar to `bin/tormentnexus`.*

3. **Generate Installers:**
   ```bash
   yarn run dist
   ```
   Output installers (.deb, .AppImage, .snap, .exe, .dmg) will be in the `dist/` directory.

## Deployment Checklist
- [ ] Verify Go binary is in `resources/bin/tormentnexus` within the package.
- [ ] Ensure sidecar binds to `127.0.0.1:9876`.
- [ ] Confirm E2E connectivity via Playwright.

## CI/CD Pipeline
Release management is automated via GitHub Actions (`.github/workflows/nodejs.yml`). Artifacts are automatically uploaded for each tagged commit.
