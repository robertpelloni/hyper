package main

import (
	"fmt"
	"github.com/robertpelloni/tormentnexus/internal/terminal"
	"github.com/robertpelloni/tormentnexus/internal/agent"
	"github.com/robertpelloni/tormentnexus/internal/mcp"
)

func main() {
	fmt.Println("TormentNexus starting...")

	// Test Terminal
	session, err := terminal.NewSession("/bin/sh", []string{"-c", "ls"})
	if err != nil {
		fmt.Printf("Error starting terminal: %v\n", err)
	} else {
		fmt.Println("Terminal session started.")
		session.Close()
	}

	// Test Agent
	harness := agent.NewHarness()
	harness.Start()
	resp, _ := harness.Execute("echo hello")
	fmt.Println("Agent response:", resp)

	// Test MCP
	agg := mcp.NewAggregator()
	agg.RegisterServer("default", "http://localhost:8080")
	fmt.Println("MCP Servers:", agg.ListServers())
}
