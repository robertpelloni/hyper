# DEPLOYMENT GUIDE

## Prerequisites
- **Node.js**: v22.x recommended.
- **Go**: v1.23+ required for sidecar compilation.
- **pnpm**: v10.x recommended.

## Build Process

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Compiling the Go Core**:
   The Go core is automatically compiled during the main build process. To build it manually:
   ```bash
   go build -o bin/tormentnexus ./cmd/tormentnexus/main.go
   ```

3. **Application Build**:
   ```bash
   pnpm run build
   ```

4. **Distribution Package**:
   Generates installers for Linux, macOS, and Windows.
   ```bash
   pnpm run dist
   ```

## Package Structure
- **Extra Resources**: The Go binary is bundled in the `resources/bin` directory of the packaged application.
- **V8 Snapshots**: Snapshots are pre-built and injected during the packaging phase to optimize startup time.

## CI/CD Integration
The project uses GitHub Actions for multi-platform builds. Ensure that the runner has both `setup-node` and `setup-go` configured.
