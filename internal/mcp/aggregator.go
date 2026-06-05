package mcp

import (
	"net/http"
	"encoding/json"
)

func (s *Server) ListAggregatedTools(w http.ResponseWriter, r *http.Request) {
	// Logic to aggregate from external MCP servers
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tools": s.tools, // Including discovered tools
	})
}

func (s *Server) ServeTelemetry(w http.ResponseWriter, r *http.Request) {
	// Telemetry for the dashboard
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "active",
		"active_tools": len(s.tools),
	})
}
