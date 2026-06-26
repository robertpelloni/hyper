# Changelog

## 1.1.5
- **Feature**: Integrated React Frontend bindings for Codex/Warp blocks via RPC.
- **UI**: Added `WarpBlock` UI element to mirror terminal block segmentation.
- **UI**: Added `GhostTextInput` to simulate inline terminal predictions (Codex feature).

## 1.1.4
- **Feature**: Extracted Codex Desktop capabilities.
- **Porting**: Ported `GhostTextManager` (inline terminal autocomplete concepts using ANSI colors) and `MultiFileContext` (local context gathering for LLMs) across the 5 language backends.

## 1.1.3
- **Feature**: Extracted Warp terminal "Command Block" feature.
- **Porting**: Successfully ported Command Block boundary definitions, execution timings, exit code captures, and standard IO routing into the 5 target architectures (TypeScript, Rust, Go, C#, Java).

## 1.1.2
- **Feature**: Extracted Copilot CLI functionality (`ShellExecutor` and `AliasGenerator`) and ported across all 5 target architectures.
- **System**: Deployed rigid repository Git sanitization sequence resolving large-scale node/wails artifact diff-pollution by utilizing heavy `.gitignore` boundaries.

## 1.1.0
- Base agent harness refactoring and multi-language foundational layers completed.
