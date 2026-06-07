# TormentNexus: Deployment and Release Guide

## Prerequisites
- **Go:** v1.25.0 (Environment uses this version explicitly)
- **Node.js:** v18+ (LTS recommended)
- **Yarn:** v1.22+
- **Python:** v3.12+ (with `setuptools` for `node-gyp` compatibility)

## Build Process

### 1. Dependency Installation
Install all Node.js and Electron dependencies. Use the `--ignore-engines` flag if running on newer Node versions (e.g., Node 22).
```bash
yarn install --ignore-engines
```

### 2. Go Core Compilation
The Go core must be compiled into the `bin/` directory. This is now hooked into the `yarn build` process, but can be done manually:
```bash
go build -o bin/tormentnexus ./cmd/tormentnexus/main.go
```

### 3. Frontend Production Build
Compile the TypeScript/React frontend and package assets:
```bash
yarn run build
```

### 4. Cross-Platform Packaging
Generate release-ready installers for the current platform:
```bash
yarn run dist
```

## Running the Application

### Development Mode
```bash
# Terminal 1: Watch and compile
yarn run dev

# Terminal 2: Launch Electron app (auto-starts Go sidecar)
yarn run app
```

### Production Execution
Run the generated executable in the `dist/` directory. The Go sidecar will be automatically managed by the main process.

## Continuous Integration
TormentNexus uses GitHub Actions for automated releases.
- **Workflow:** `.github/workflows/nodejs.yml`
- **Supported Platforms:** Ubuntu (x64/ARM), macOS (ARM64), Windows (x64/ARM64).
- **Artifacts:** Uploaded to GitHub Actions and ready for attachment to Releases.

## Troubleshooting

### node-pty Build Failures
If `node-pty` fails to build, ensure `python3-setuptools` is installed:
```bash
python3 -m pip install setuptools --break-system-packages
yarn run rebuild-node-pty
```

### Go Version Mismatch
Ensure `go version` returns `go1.25.0`. If using a different version, update `go.mod` accordingly.

### Code Signing (macOS)
To bypass code signing locally:
```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
yarn run dist
```
