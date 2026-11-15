@echo off
:: TormentNexus Start Script
:: ===================================
:: Launches the TormentNexus backend and application services

echo [TormentNexus] Starting TormentNexus MCP Server on :8080...
if exist bin\tormentnexus-mcp.exe (
    start /b bin\tormentnexus-mcp.exe
) else (
    go run .\cmd\tormentnexus\
)
