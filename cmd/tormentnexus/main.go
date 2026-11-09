package main

import (
	"fmt"
	"net/http"
	"os"
	"tormentnexus/internal/mcp"
)

// SetupStandaloneServer initializes an MCP server populated with standard built-in tools
func SetupStandaloneServer() *mcp.Server {
	server := mcp.NewServer()

	// Register all standard MCP tools with explicit schemas and categories
	server.RegisterTool(mcp.Tool{
		Name:        "shell_execute",
		Category:    "System",
		Description: "Execute a shell command and return the output",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"command": map[string]interface{}{
					"type":        "string",
					"description": "The command to execute",
				},
			},
			"required": []string{"command"},
		},
		Required: []string{"command"},
	})

	server.RegisterTool(mcp.Tool{
		Name:        "file_read",
		Category:    "Filesystem",
		Description: "Read the contents of a file",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"path": map[string]interface{}{
					"type":        "string",
					"description": "The file path to read",
				},
			},
			"required": []string{"path"},
		},
		Required: []string{"path"},
	})

	server.RegisterTool(mcp.Tool{
		Name:        "file_write",
		Category:    "Filesystem",
		Description: "Write content to a file",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"path": map[string]interface{}{
					"type":        "string",
					"description": "The file path to write",
				},
				"content": map[string]interface{}{
					"type":        "string",
					"description": "The content to write",
				},
			},
			"required": []string{"path", "content"},
		},
		Required: []string{"path", "content"},
	})

	server.RegisterTool(mcp.Tool{
		Name:        "agent_status",
		Category:    "Agent",
		Description: "Check the status of the autonomous agent harness",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	})

	server.RegisterTool(mcp.Tool{
		Name:        "session_list",
		Category:    "System",
		Description: "List all active PTY sessions",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	})

	server.RegisterTool(mcp.Tool{
		Name:        "workspace_search",
		Category:    "Intelligence",
		Description: "Search workspace file paths and file contents in-memory",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"query": map[string]interface{}{
					"type":        "string",
					"description": "The search keyword or pattern",
				},
			},
			"required": []string{"query"},
		},
		Required: []string{"query"},
	})

	server.RegisterTool(mcp.Tool{
		Name:        "git_status",
		Category:    "System",
		Description: "Get current Git working branch and modified file status",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	})

	server.RegisterTool(mcp.Tool{
		Name:        "system_info",
		Category:    "System",
		Description: "Query host platform architecture, CPU count, and runtime stats",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	})

	return server
}

func main() {
	server := SetupStandaloneServer()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	server.SetupRoutes(mux)

	fmt.Printf("TormentNexus MCP server starting on :%s...\n", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil && err != http.ErrServerClosed {
		fmt.Printf("Server failed: %v\n", err)
	}
}
