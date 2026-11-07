#!/usr/bin/env bash
set -e

echo "[TormentNexus] Starting TormentNexus MCP Server on :8080..."
if [ -f "bin/tormentnexus-mcp" ]; then
    ./bin/tormentnexus-mcp
else
    go run ./cmd/tormentnexus
fi
