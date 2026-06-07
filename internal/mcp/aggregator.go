package mcp

type ServerInfo struct {
	Name    string `json:"name"`
	URL     string `json:"url"`
	Status  string `json:"status"`
}

type Aggregator struct {
	servers map[string]ServerInfo
}

func NewAggregator() *Aggregator {
	return &Aggregator{
		servers: map[string]ServerInfo{
			"filesystem": {Name: "filesystem", URL: "mcp://localhost:8080", Status: "connected"},
			"github":     {Name: "github", URL: "mcp://localhost:8081", Status: "connected"},
		},
	}
}

func (a *Aggregator) ListServers() []ServerInfo {
	var list []ServerInfo
	for _, s := range a.servers {
		list = append(list, s)
	}
	return list
}
