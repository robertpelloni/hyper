# TormentNexus: The Ultimate LLM Harness

TormentNexus is a high-performance terminal and autonomous agent harness built with a Go-based core and an Electron frontend. It is designed to be the central hub for AI-powered development, integrating features from top-tier tools like Tabby, Warp, and others.

## Key Features

- **Go-based Core:** High-performance PTY management and system interactions.
- **LLM Agent Harness:** Built-in loops for autonomous agent execution and interaction.
- **MCP Aggregator:** Centralized hub for Model Context Protocol (MCP) servers.
- **Modern CI/CD:** Fully automated builds for x64 and ARM64 platforms across Linux, macOS, and Windows.
- **Extensible Architecture:** Compatible with existing terminal plugins and AI extensions.

## Setup and Usage

### Prerequisites
- **Go:** 1.25.0 or later
- **Node.js:** 18.x or later
- **Yarn:** Latest version

### Building from Source

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/robertpelloni/TormentNexus.git
    cd TormentNexus
    ```

2.  **Install Dependencies:**
    ```bash
    yarn install --ignore-engines
    ```

3.  **Build the Go Core:**
    ```bash
    go build -o bin/tormentnexus ./cmd/tormentnexus/main.go
    ```

4.  **Build the Frontend:**
    ```bash
    yarn run build
    ```

### Running the Application
- **Run in Development Mode:**
  ```bash
  yarn run dev
  # Then in another tab
  yarn run app
  ```
- **Run the Go Harness standalone:**
  ```bash
  ./bin/tormentnexus
  ```

## Documentation
For more detailed information, please refer to:
- [VISION.md](./VISION.md): The long-term project goal.
- [ROADMAP.md](./ROADMAP.md): Current progress and future plans.
- [DEPLOY.md](./DEPLOY.md): Deployment instructions.
- [MISSION.md](./MISSION.md): Core values and project philosophy.

## License
MIT
