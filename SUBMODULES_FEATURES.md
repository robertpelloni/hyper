# SUBMODULES_FEATURES: TormentNexus Integrated Functionalities

## Structural Map
- `submodules/bobbybookmarks`: Internal tool catalog, resource aggregator, and MCP directory.
- `submodules/hermes-agent`: Advanced agentic harness with tool use and reasoning.
- `submodules/pi-mono`: Default agent harness and task execution engine.
- `submodules/tabby`: Self-hosted AI coding assistant core.
- `submodules/warp`: Terminal with AI integration and collaborative features.

## Functionality List

### BobbyBookmarks
- **Tool Cataloging**: Scrapes and indexes MCP directories and coding tools.
- **Resource Aggregation**: Maintains a centralized database of links and documentation.
- **Backend API**: Go-based API for tool and bookmark management.
- **MCP Integration**: `extract_mcp.py` for automated MCP tool extraction.

### Hermes-Agent
- **Agentic reasoning**: Advanced chains for task decomposition.
- **Tool usage**: Native support for complex tool calls.
- **Recursion**: Recursive submodule `tinker-atropos` for specialized LLM tasks.

### Pi-Mono
- **Agent Orchestration**: Core harness for running multiple AI agents.
- **Task Management**: Structured task execution and tracking.
- **Memory Management**: Sessions and context persistence.

### Tabby
- **Code Intelligence**: High-performance code completion and indexing.
- **LLM Integration**: Interface for local and remote LLMs.

### Warp
- **Terminal UI**: Block-based command execution and AI-powered command suggestions.
- **Collaboration**: Shared terminal workflows and cloud-sync.
