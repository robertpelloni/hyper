# DEPLOYMENT

## Prerequisites
- Go 1.25.0
- Node.js 18+
- Yarn

## Building from Source
1. Install dependencies: `yarn install --ignore-engines`
2. Build Go core: `go build -o bin/tormentnexus ./cmd/tormentnexus/main.go`
3. Build frontend: `yarn run build`

## Running
Execute the Go binary: `./bin/tormentnexus` or run the Electron app: `yarn run app`.
