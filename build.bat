@echo off
:: TormentNexus Build Script
:: ===================================
:: Builds frontend assets and compiles the Go backend binary

echo [TormentNexus] Building frontend...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [TormentNexus] Frontend build failed
    exit /b 1
)
cd ..

echo.
echo [TormentNexus] Compiling Go Core...
go build -buildvcs=false -o bin\tormentnexus.exe .
go build -buildvcs=false -o bin\tormentnexus-mcp.exe .\cmd\tormentnexus\
if %ERRORLEVEL% NEQ 0 (
    echo [TormentNexus] Go compilation failed
    exit /b 1
)

echo.
echo [TormentNexus] Build complete!
