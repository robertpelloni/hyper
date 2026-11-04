# TormentNexus Architectural Memory

- **Project Identity:** TormentNexus is the exclusive project branding across all files, binaries, scripts, and interfaces.
- **Single-Page Mission Control UI:** All mission-critical controls (Autonomous Agent Harness, MCP Aggregator & Runner, Terminal Session Manager, Server Lifecycle, System Tray, and Quick Config) are organized on a singular, consolidated page with high-value telemetry displayed prominently.
- **Tooltips & Guidance:** Every interactive control and informational badge features contextual tooltip markers (`?`) explaining its operational purpose and structural role.
- **Server Lifecycle:** Backend HTTP MCP server runs on `:8080` with endpoints `/tools` and `/call` (supporting POST execution). Server shutdown and restart are controllable via frontend bindings and system tray menus.
- **Go Core Requirement:** Built with Go v1.25.0/v1.26.x compatible runtime.
- **Script Governance:** Redundant scripts are archived non-destructively in `archive/`. Primary runners are `build.sh` / `start.sh` (Linux/macOS) and `build.bat` / `start.bat` (Windows).
