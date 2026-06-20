# Goose CLI Architecture and Feature Analysis

## Overview
Goose is a general-purpose AI agent built in Rust by the Block team (recently moved to Agentic AI Foundation / AAIF). It provides a desktop app, CLI, and API. It interfaces with various LLM providers (Anthropic, OpenAI, Google, etc.) and integrates deeply with extensions via the Model Context Protocol (MCP).

## Core Features Identified
- **MCP Integration (`goose-mcp`):** Acts as a primary standard for interfacing with extensions. It has native servers for memory, tutorial/onboarding, a "peekaboo" server (for fetching environment context), an auto-visualizer, and a computer controller.
- **Provider Abstraction (`goose-providers`):** Goose abstracts its LLM provider calls extensively, allowing it to seamlessly switch between local models (Ollama) and cloud APIs (OpenRouter, Azure, Bedrock, Anthropic).
- **Session/State Management (`goose-sdk`):** Provides a robust `goose-sdk` for managing agent sessions, conversation history, and tool calling natively in Rust.
- **Extension/Plugin Ecosystem:** A heavy reliance on external tool extensions and workflows. They offer "workflow recipes" out of the box, treating the agent more like an orchestrator for smaller specific scripts.
- **Agent Orchestration (`goose-server`):** Has a dedicated API server crate, showing a clean separation between the frontend UI (or CLI) and the backend orchestrator.

## Implications for our Re-implementation
To achieve feature parity in Rust, Go, C#, Java, and TypeScript:
1. We must implement **Model Context Protocol (MCP)** standards to dynamically load and register tools and prompts.
2. We need to scaffold a generic **Provider Interface** that all agent implementations can use to communicate with different LLMs interchangeably.
3. We need a concept of **Agent Memory/Session Management** based on the Goose design, separating the conversation context from the core tool-calling logic.
