package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/robertpelloni/tormentnexus/internal/agent"
	"github.com/robertpelloni/tormentnexus/internal/mcp"
	"github.com/robertpelloni/tormentnexus/internal/terminal"
)

var harness *agent.Harness
var aggregator *mcp.Aggregator

func main() {
	harness = agent.NewHarness()
	harness.Start()
	aggregator = mcp.NewAggregator()

	r := mux.NewRouter()
	r.HandleFunc("/agent/execute", executeCommand).Methods("POST")
	r.HandleFunc("/mcp/servers", listServers).Methods("GET")
	r.HandleFunc("/terminal/session", startTerminal).Methods("POST")

	port := os.Getenv("TORMENTNEXUS_PORT")
	if port == "" {
		port = "9876"
	}

	fmt.Printf("TormentNexus Go Core listening on 127.0.0.1:%s\n", port)
	log.Fatal(http.ListenAndServe("127.0.0.1:"+port, r))
}

func executeCommand(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Command string `json:"command"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp, err := harness.Execute(req.Command)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"response": resp})
}

func listServers(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(aggregator.ListServers())
}

func startTerminal(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Shell string   `json:"shell"`
		Args  []string `json:"args"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	session, err := terminal.NewSession(req.Shell, req.Args)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	session.Close()
	json.NewEncoder(w).Encode(map[string]string{"status": "Terminal test session closed successfully"})
}
