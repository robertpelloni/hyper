# TORMENTNEXUS ARCHITECTURAL MEMORY
- **Hybrid Architecture**: Leverages Electron for the UI and Go for high-performance terminal operations and agent logic.
- **Sidecar Security**: The Go core binds strictly to 127.0.0.1:9876 to ensure secure internal communication.
- **Interactive Agent**: Terminal input is intercepted in the Electron main process to route commands starting with `/agent` to the Go reasoning loop.
- **Ported Features**: Successfully integrated command blocks (Warp), LSP-compatible completions (Tabby), and hardened SSH (Wave).
