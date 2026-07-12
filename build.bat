@echo off
echo TormentNexus Build Script
echo =========================

echo.
echo [1/3] Building frontend...
cd frontend
call npm run build
cd ..

echo.
echo [2/3] Building Go binary...
wails build -ldflags "-s -w"

echo.
echo [3/3] Copying to project root...
copy /Y build\bin\tormentnexus.exe tormentnexus.exe

echo.
echo Done! Run tormentnexus.exe to launch TormentNexus.
echo Binary size:
for %%A in (tormentnexus.exe) do echo %%~zA bytes
