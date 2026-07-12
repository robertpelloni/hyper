package agent

import (
	"encoding/json"
	"fmt"
)

// TabbyProtocol represents a simplified Go implementation of Tabby's LSP-based protocol
type TabbyProtocol struct {
	Endpoint string
	Token    string
}

type TabbyInitializeParams struct {
	ClientInfo ClientInfo `json:"clientInfo"`
}

type ClientInfo struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

func (p *TabbyProtocol) Initialize(params TabbyInitializeParams) (string, error) {
	data, err := json.Marshal(params)
	if err != nil {
		return "", err
	}
	// TODO: Send this to the actual Tabby server endpoint
	return fmt.Sprintf("Tabby Initialized with: %s", string(data)), nil
}

func (p *TabbyProtocol) Completion(prompt string) (string, error) {
	// TODO: Implement actual completion request to Tabby server
	return fmt.Sprintf("Tabby completion for: %s", prompt), nil
}
