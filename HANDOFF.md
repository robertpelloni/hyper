# TormentNexus v1.1.0: Session Handoff

## Overview of Accomplishments
1. **Unified Mission Control Dashboard:**
   - Redesigned and consolidated all application functions (Autonomous Agent Control, MCP Aggregator & Runner, Terminal Session Manager, Server Lifecycle, and Quick Config) into one singular, non-fragmented page (`frontend/src/components/Dashboard.tsx`).
   - Integrated contextual tooltip markers (`Tooltip.tsx`) across all controls, metric badges, and forms for maximum clarity and guidance.
   - Updated `Header.tsx`, `StatusBar.tsx`, and `App.tsx` with seamless toggling between Terminal and Mission Control (`Ctrl+Shift+D` shortcut).

2. **System Tray & Server Lifecycle Management:**
   - Implemented server lifecycle controls (`StartMCPServer`, `StopMCPServer`, `RestartServers`, `StopServers`, `GetServerStatus`, `ToggleSystemTray`, `QuitApp`) in `app_core.go`.
   - Wired desktop application menu and tray actions in `main.go`.
   - Updated MCP server (`internal/mcp/server.go`) to support interactive HTTP `POST /call` with JSON payload decoding and formatted execution responses.

3. **Script Governance & Sanitization:**
   - Removed unresolvable `$schema` key from `wails.json`.
   - Archived legacy `start.bat` non-destructively into `archive/start.bat.bak`.
   - Sanitized `build.bat` and `start.bat` to eliminate legacy branding.
   - Created modern cross-platform executable scripts `build.sh` and `start.sh`.

4. **Testing and Verification:**
   - Added unit test suite in `app_core_test.go` covering AgentHarness, MCPAggregator, and App server/tray status.
   - Verified that `go test ./...` passes cleanly and all frontend/Go builds succeed.
