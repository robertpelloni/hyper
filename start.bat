@echo off
:: TormentNexus Go Build Script - v4.63.0
:: ===================================
:: Builds the tormentnexus Go binary from the cmd/tormentnexus entry point
:: (Module was originally branded "tormentnexus" by Jules AI)
:: TODO: Rebrand module path from tormentnexus to tormentnexus

echo [TormentNexus] Building tormentnexus.exe...
go build -buildvcs=false -o tormentnexus.exe -ldflags "-s -w" ./cmd/tormentnexus/
if %ERRORLEVEL% NEQ 0 (
    echo [TormentNexus] BUILD FAILED
    exit /b 1
)
for %%A in (tormentnexus.exe) do echo [TormentNexus] Built: %%~zA bytes
echo [TormentNexus] Starting on :8080...
start /b tormentnexus.exe
