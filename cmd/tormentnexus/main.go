package main

import (
	"fmt"
	"net/http"
	"tormentnexus/internal/mcp"
)

func main() {
	server := mcp.NewServer()
	server.RegisterTool(mcp.Tool{
		Name:        "test_tool",
		Description: "A test tool for discovery verification",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	})

	mux := http.NewServeMux()
	server.SetupRoutes(mux)

	fmt.Println("TormentNexus MCP server starting on :8080...")
	http.ListenAndServe(":8080", mux)
}
