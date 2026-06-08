# TormentNexus: Deployment and Release Guide

## Prerequisites
- **Go:** v1.23.0 (Minimum)
- **Node.js:** v18+
- **Yarn:** v1.22+
- **Python:** v3.12+

## Packaging
To generate release-ready installers:
```bash
yarn run dist
```
This will bundle the Go sidecar binary into the `resources/bin/` directory of the application package.

## Distribution
The following artifacts are generated in the `dist/` directory:
- `.deb`: Debian/Ubuntu installer.
- `.AppImage`: Portable Linux binary.
- `.snap`: Snapcraft package.

## CI/CD
Fully automated builds are handled via GitHub Actions (`.github/workflows/nodejs.yml`), supporting x64 and ARM64 architectures.
