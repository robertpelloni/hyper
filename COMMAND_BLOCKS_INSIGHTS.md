# Warp-like Command Blocks Implementation Insights

This document outlines the challenges and insights gathered during the porting and implementation of the "Warp-like command blocks" feature in the TormentNexus project.

## 1. Naive Parsing vs. RPC Stubbing
The primary challenge in implementing command blocks within a raw PTY stream (which mixes `stdout`, `stderr`, and user input into a single byte stream) is reliably determining where a command begins and ends.

*   **Initial Approach (Failed):** An early attempt involved scanning the raw byte stream in the Go backend (`session.go`) for standard shell prompt indicators (e.g., `$\ `, `# `, `>\ `) or simply delimiting blocks on newlines (`\n`).
    *   *Challenge:* This naive approach caused a severe memory leak. Large outputs (like running `dmesg` or `npm install`) would either spam the frontend with hundreds of micro-blocks (if split on newlines) or cause an unbounded buffer growth waiting for a perfect prompt string that might never arrive intact due to chunk boundaries.
*   **Resolution:** We pivoted to a more robust, architecturally sound RPC stubbing approach. Instead of guessing block boundaries from the raw stream, we exposed an explicit `RegisterCommandBlock` method on the `SessionManager`. This allows the agent harness, or eventually a properly configured preexec/precmd shell integration, to explicitly dispatch well-formed `CommandBlock` JSON metadata to the frontend.

## 2. UI/UX: Sidebar vs. Inline Rendering
*   *Insight:* While Warp renders blocks directly within the flow of the terminal, retrofitting this into `xterm.js` is highly complex due to how `xterm.js` manages its internal canvas grid.
*   *Resolution:* We adopted a hybrid approach. The raw text remains in the highly performant `xterm.js` container, but a React-based overlay (`CommandBlock.tsx`) was introduced to render semantic, interactive blocks alongside the terminal. This provides the rich metadata visualization (including Codex AI annotations) without breaking the core terminal rendering engine.

## 3. Strict Naming Conventions
*   *Challenge:* Ensuring that the legacy "hyper" branding was completely eradicated.
*   *Resolution:* A strict, case-insensitive refactoring pass was required across the entire codebase to replace deprecated terms with `TormentNexus`, ensuring consistency across the UI, configurations, and internal Go types.

## Next Steps
Future iterations will require deep shell integration (e.g., injecting a custom `PROMPT_COMMAND` in `bash` or `zsh`) to fully automate the emission of `RegisterCommandBlock` calls without relying purely on the agent harness.
