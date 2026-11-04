#!/usr/bin/env bash
set -e

echo "[TormentNexus] Building frontend..."
cd frontend
npm run build
cd ..

echo "[TormentNexus] Building Go Core and MCP server..."
mkdir -p bin
go build -o bin/tormentnexus .
go build -o bin/tormentnexus-mcp ./cmd/tormentnexus

echo "[TormentNexus] Build successful!"
