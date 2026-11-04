@echo off
:: Hyper Go Build Script - v4.63.0
:: ===================================
:: Builds the hyper Go binary from the cmd/tormentnexus entry point
:: (Module was originally branded "tormentnexus" by Jules AI)
:: TODO: Rebrand module path from tormentnexus to hyper

echo [Hyper] Building hyper-go.exe...
go build -buildvcs=false -o hyper-go.exe -ldflags "-s -w" ./cmd/tormentnexus/
if %ERRORLEVEL% NEQ 0 (
    echo [Hyper] BUILD FAILED
    exit /b 1
)
for %%A in (hyper-go.exe) do echo [Hyper] Built: %%~zA bytes
echo [Hyper] Starting on :8080...
start /b hyper-go.exe
