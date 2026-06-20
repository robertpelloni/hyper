# Aider CLI Architecture and Feature Analysis

## Overview
Aider is a command-line chat tool that allows you to write and edit code with LLMs. It is built in Python.

## Core Features Identified
- **File Map / Repo Map (`aider/repomap.py`):** Creates a map of the entire codebase using tree-sitter to give the LLM context of the project structure, including definitions of classes, functions, and variables, without needing to include the full file content.
- **Git Integration (`aider/repo.py`):** Automatically commits changes with sensible messages. Can diff, manage, and undo AI changes. Keeps track of state via standard git concepts.
- **Edit Formats (`aider/coders/`):** Aider has multiple "coders" (e.g., `editblock_coder.py`, `udiff_coder.py`, `wholefile_coder.py`) which dictate how the LLM proposes code edits. The primary method uses a "Search and Replace" diff block format which allows surgical edits.
- **Voice-to-code (`aider/voice.py`):** Voice recording functionality to ask for changes out loud.
- **Scraping / URL Fetching (`aider/scrape.py`):** Can fetch and read documentation/URLs provided by the user.
- **Linting and Testing (`aider/linter.py`, `aider/commands.py`):** Can automatically lint and test code after an AI edit. If there are errors, it feeds the errors back to the LLM to fix automatically.
- **Multiple LLM Support (`aider/models.py`, `aider/llm.py`):** Built on top of litellm to support OpenAI, Anthropic, DeepSeek, OpenRouter, and more.
- **Multi-file edits (`aider/commands.py`):** Can be asked to edit multiple files in one request and coordinate those edits.
- **Terminal UI (`aider/io.py`):** Uses prompt-toolkit and rich for syntax highlighting, autocomplete, and robust terminal interaction.

## Implications for our Re-implementation
To achieve feature parity in Rust, Go, C#, Java, and TypeScript:
1. We need a robust **tree-sitter implementation** in each language to build the Repo Map context.
2. We need **Search & Replace diff application logic**. This is tricky because the LLMs don't always perfectly match the file structure. Fuzzy matching or strict SEARCH/REPLACE block parsing is required.
3. **Automated Git tracking** must be native to the agent loop.
4. **Command execution and feedback loops** (for testing/linting).
