package mcp

import (
	"fmt"
	"sync"
)

type Aggregator struct {
	servers map[string]string
	mu      sync.RWMutex
}

func NewAggregator() *Aggregator {
	return &Aggregator{
		servers: make(map[string]string),
	}
}

func (a *Aggregator) RegisterServer(name, url string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.servers[name] = url
}

func (a *Aggregator) ListServers() map[string]string {
	a.mu.RLock()
	defer a.mu.RUnlock()
	copy := make(map[string]string)
	for k, v := range a.servers {
		copy[k] = v
	}
	return copy
}

func (a *Aggregator) ProxyRequest(serverName string, payload string) (string, error) {
	a.mu.RLock()
	url, ok := a.servers[serverName]
	a.mu.RUnlock()
	if !ok {
		return "", fmt.Errorf("server %s not found", serverName)
	}
	// Simplified proxy for now
	return fmt.Sprintf("Proxied to %s (%s): %s", serverName, url, payload), nil
}
