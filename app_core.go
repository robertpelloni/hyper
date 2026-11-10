package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime" // wails runtime for window/events/dialogs
	"tormentnexus/internal/mcp"
	"tormentnexus/internal/terminal"
)

// ServerStatus represents the state of backend services
type ServerStatus struct {
	MCPServerRunning bool   `json:"mcpServerRunning"`
	MCPServerPort    int    `json:"mcpServerPort"`
	AgentRunning     bool   `json:"agentRunning"`
	TrayEnabled      bool   `json:"trayEnabled"`
	ActiveSessions   int    `json:"activeSessions"`
	UptimeSeconds    int64  `json:"uptimeSeconds"`
	Version          string `json:"version"`
}

// PluginInfo represents terminal plugin metadata
type PluginInfo struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Installed   bool   `json:"installed"`
	URL         string `json:"url"`
}

// App is the main application struct for Wails
type App struct {
	ctx            context.Context
	sessions       *SessionManager
	config         *ConfigManager
	agent          *AgentHarness
	mcp            *MCPAggregator
	terminalBuffer *terminal.Buffer
	mcpServer      *http.Server
	mcpMu          sync.Mutex
	startTime      time.Time
	trayVisible    bool
}

func NewApp() *App {
	return &App{
		startTime:      time.Now(),
		trayVisible:    true,
		terminalBuffer: terminal.NewBuffer(),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.sessions = NewSessionManager()
	a.sessions.SetRuntime(a)
	a.config = NewConfigManager()
	a.agent = NewAgentHarness()
	a.mcp = NewMCPAggregator()
	if a.terminalBuffer == nil {
		a.terminalBuffer = terminal.NewBuffer()
	}

	// Connect Agent Harness to MCP Aggregator and Runtime
	a.agent.SetMCPAggregator(a.mcp)
	a.agent.SetRuntime(a)

	// Start integrated MCP server on :8080 in background
	go func() {
		_ = a.StartMCPServer(8080)
	}()
}

func (a *App) shutdown(ctx context.Context) {
	_ = a.StopMCPServer()
	if a.sessions != nil {
		a.sessions.CloseAll()
	}
	if a.agent != nil {
		a.agent.ExecuteCommand("stop")
	}
}

func (a *App) beforeClose(ctx context.Context) bool {
	return true
}

// EmitEvent emits a named event with data to the frontend
func (a *App) EmitEvent(name string, data ...interface{}) {
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, name, data...)
	}
}

// ---- Server Lifecycle & Tray Controls ----

// StartMCPServer starts the embedded HTTP MCP server
func (a *App) StartMCPServer(port int) error {
	a.mcpMu.Lock()
	defer a.mcpMu.Unlock()

	if a.mcpServer != nil {
		return fmt.Errorf("MCP server is already running")
	}

	server := mcp.NewServer()
	server.RegisterTool(mcp.Tool{
		Name:        "shell_execute",
		Category:    "System",
		Description: "Execute a shell command in TormentNexus",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"command": map[string]interface{}{"type": "string", "description": "The bash shell command to execute"},
			},
			"required": []string{"command"},
		},
		Required: []string{"command"},
	})
	server.RegisterTool(mcp.Tool{
		Name:        "agent_status",
		Category:    "Agent",
		Description: "Query autonomous agent status and reasoning traces",
		InputSchema: map[string]interface{}{
			"type":       "object",
			"properties": map[string]interface{}{},
		},
	})
	server.RegisterTool(mcp.Tool{
		Name:        "file_read",
		Category:    "Filesystem",
		Description: "Read file contents from workspace",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"path": map[string]interface{}{"type": "string", "description": "File path relative to workspace root"},
			},
			"required": []string{"path"},
		},
		Required: []string{"path"},
	})
	server.RegisterTool(mcp.Tool{
		Name:        "file_write",
		Category:    "Filesystem",
		Description: "Write content to a workspace file",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"path":    map[string]interface{}{"type": "string", "description": "File path relative to workspace root"},
				"content": map[string]interface{}{"type": "string", "description": "Content string to write"},
			},
			"required": []string{"path", "content"},
		},
		Required: []string{"path", "content"},
	})
	server.RegisterTool(mcp.Tool{
		Name:        "session_list",
		Category:    "System",
		Description: "List active terminal sessions and states",
		InputSchema: map[string]interface{}{
			"type":       "object",
			"properties": map[string]interface{}{},
		},
	})
	server.RegisterTool(mcp.Tool{
		Name:        "workspace_search",
		Category:    "Intelligence",
		Description: "Search workspace file paths and contents",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"query": map[string]interface{}{"type": "string", "description": "Search term or regex pattern"},
			},
			"required": []string{"query"},
		},
		Required: []string{"query"},
	})
	server.RegisterTool(mcp.Tool{
		Name:        "git_status",
		Category:    "System",
		Description: "Query current Git branch and repository state",
		InputSchema: map[string]interface{}{
			"type":       "object",
			"properties": map[string]interface{}{},
		},
	})
	server.RegisterTool(mcp.Tool{
		Name:        "system_info",
		Category:    "System",
		Description: "Get CPU, memory, and OS runtime info",
		InputSchema: map[string]interface{}{
			"type":       "object",
			"properties": map[string]interface{}{},
		},
	})

	mux := http.NewServeMux()
	server.SetupRoutes(mux)

	a.mcpServer = &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: mux,
	}

	go func() {
		if err := a.mcpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("[TormentNexus] MCP server error: %v\n", err)
		}
	}()

	a.EmitEvent("server:status_changed", a.GetServerStatus())
	return nil
}

// ClearMCPExecutionHistory resets tool execution history
func (a *App) ClearMCPExecutionHistory() {
	if a.mcp != nil {
		a.mcp.ClearHistory()
	}
	a.EmitEvent("mcp:history_cleared")
}

// StopMCPServer stops the embedded HTTP MCP server
func (a *App) StopMCPServer() error {
	a.mcpMu.Lock()
	defer a.mcpMu.Unlock()

	if a.mcpServer == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	err := a.mcpServer.Shutdown(ctx)
	a.mcpServer = nil

	a.EmitEvent("server:status_changed", a.GetServerStatus())
	return err
}

// RestartServers stops and restarts all backend servers
func (a *App) RestartServers() map[string]interface{} {
	_ = a.StopMCPServer()
	time.Sleep(100 * time.Millisecond)
	err := a.StartMCPServer(8080)
	status := "success"
	errMsg := ""
	if err != nil {
		status = "error"
		errMsg = err.Error()
	}
	return map[string]interface{}{
		"status": status,
		"error":  errMsg,
		"server": a.GetServerStatus(),
	}
}

// StopServers shuts down all backend server processes cleanly
func (a *App) StopServers() map[string]interface{} {
	err := a.StopMCPServer()
	if a.agent != nil {
		a.agent.ExecuteCommand("stop")
	}
	errMsg := ""
	if err != nil {
		errMsg = err.Error()
	}
	return map[string]interface{}{
		"status": "stopped",
		"error":  errMsg,
		"server": a.GetServerStatus(),
	}
}

// GetServerStatus returns a comprehensive status object of all backend subsystems
func (a *App) GetServerStatus() ServerStatus {
	a.mcpMu.Lock()
	isMCPOk := a.mcpServer != nil
	a.mcpMu.Unlock()

	agentRunning := false
	if a.agent != nil {
		st := a.agent.GetStatus()
		if r, ok := st["running"].(bool); ok {
			agentRunning = r
		}
	}

	sessionsCount := 0
	if a.sessions != nil {
		sessionsCount = len(a.sessions.ListSessions())
	}

	uptime := int64(time.Since(a.startTime).Seconds())

	return ServerStatus{
		MCPServerRunning: isMCPOk,
		MCPServerPort:    8080,
		AgentRunning:     agentRunning,
		TrayEnabled:      a.trayVisible,
		ActiveSessions:   sessionsCount,
		UptimeSeconds:    uptime,
		Version:          "1.1.0",
	}
}

// ToggleSystemTray toggles system tray visibility state
func (a *App) ToggleSystemTray() bool {
	a.trayVisible = !a.trayVisible
	a.EmitEvent("tray:status_changed", a.trayVisible)
	return a.trayVisible
}

// QuitApp cleanly terminates all sessions, servers, and exits the application
func (a *App) QuitApp() {
	a.shutdown(context.Background())
	if a.ctx != nil {
		runtime.Quit(a.ctx)
	} else {
		os.Exit(0)
	}
}

// ---- Terminal Command History & Buffer Operations ----

// RecordTerminalCommand stores an executed command and its output in the semantic buffer
func (a *App) RecordTerminalCommand(cmd, output string, success bool) terminal.Block {
	if a.terminalBuffer == nil {
		a.terminalBuffer = terminal.NewBuffer()
	}
	blk := a.terminalBuffer.AddBlock(cmd, output, success)
	a.EmitEvent("terminal:block_added", blk)
	return blk
}

// GetTerminalHistory returns all recorded terminal command blocks
func (a *App) GetTerminalHistory() []terminal.Block {
	if a.terminalBuffer == nil {
		return []terminal.Block{}
	}
	return a.terminalBuffer.GetBlocks()
}

// SearchTerminalHistory performs a keyword search across commands and outputs
func (a *App) SearchTerminalHistory(keyword string) []terminal.Block {
	if a.terminalBuffer == nil {
		return []terminal.Block{}
	}
	return a.terminalBuffer.SearchBlocks(keyword)
}

// ClearTerminalHistory flushes all recorded terminal command blocks
func (a *App) ClearTerminalHistory() {
	if a.terminalBuffer != nil {
		a.terminalBuffer.Clear()
		a.EmitEvent("terminal:history_cleared")
	}
}

// ---- Window Controls ----

func (a *App) WindowMinimise() {
	if a.ctx != nil {
		runtime.WindowMinimise(a.ctx)
	}
}

func (a *App) WindowMaximise() {
	if a.ctx != nil {
		runtime.WindowMaximise(a.ctx)
	}
}

func (a *App) WindowUnmaximise() {
	if a.ctx != nil {
		runtime.WindowUnmaximise(a.ctx)
	}
}

func (a *App) WindowToggleMaximise() {
	if a.ctx != nil {
		runtime.WindowToggleMaximise(a.ctx)
	}
}

func (a *App) WindowClose() {
	if a.ctx != nil {
		runtime.Quit(a.ctx)
	} else {
		os.Exit(0)
	}
}

func (a *App) WindowIsMaximised() bool {
	if a.ctx != nil {
		return runtime.WindowIsMaximised(a.ctx)
	}
	return false
}

func (a *App) WindowFullscreen() {
	if a.ctx != nil {
		runtime.WindowFullscreen(a.ctx)
	}
}

func (a *App) WindowUnfullscreen() {
	if a.ctx != nil {
		runtime.WindowUnfullscreen(a.ctx)
	}
}

func (a *App) WindowIsFullscreen() bool {
	if a.ctx != nil {
		return runtime.WindowIsFullscreen(a.ctx)
	}
	return false
}

func (a *App) WindowSetSize(width, height int) {
	if a.ctx != nil {
		runtime.WindowSetSize(a.ctx, width, height)
	}
}

func (a *App) WindowSetPosition(x, y int) {
	if a.ctx != nil {
		runtime.WindowSetPosition(a.ctx, x, y)
	}
}

func (a *App) WindowGetPosition() (int, int) {
	if a.ctx != nil {
		return runtime.WindowGetPosition(a.ctx)
	}
	return 0, 0
}

func (a *App) WindowGetSize() (int, int) {
	if a.ctx != nil {
		return runtime.WindowGetSize(a.ctx)
	}
	return 1024, 768
}

// ---- System Operations ----

func (a *App) OpenURL(url string) {
	if a.ctx != nil {
		runtime.BrowserOpenURL(a.ctx, url)
	}
}

func (a *App) GetPlatform() string {
	return "linux"
}

func (a *App) GetHomeDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "/home"
	}
	return home
}

func (a *App) GetEnv(key string) string {
	return os.Getenv(key)
}

func (a *App) GetWorkingDir() string {
	wd, err := os.Getwd()
	if err != nil {
		return ""
	}
	return wd
}

// GetSessionOutput retrieves the tail output lines of a session
func (a *App) GetSessionOutput(id string, maxLines int) string {
	if a.sessions == nil {
		return ""
	}
	return a.sessions.GetSessionOutput(id, maxLines)
}

// AppendSessionOutput appends lines to a session's buffer (useful for tests or IPC simulation)
func (a *App) AppendSessionOutput(id string, text string) {
	if a.sessions != nil {
		a.sessions.AppendOutput(id, text)
	}
}

// ---- Terminal Plugins & Extensions Hub ----

// GetInstalledPlugins retrieves user-configured plugins from config
func (a *App) GetInstalledPlugins() []string {
	if a.config == nil {
		return []string{}
	}
	cfgVal := a.config.GetConfigValue("plugins")
	if cfgVal == nil {
		return []string{}
	}
	switch v := cfgVal.(type) {
	case []string:
		return v
	case []interface{}:
		res := make([]string, 0, len(v))
		for _, item := range v {
			if s, ok := item.(string); ok {
				res = append(res, s)
			}
		}
		return res
	}
	return []string{}
}

// GetRecommendedPlugins returns a catalog of vetted plugins with install status
func (a *App) GetRecommendedPlugins() []PluginInfo {
	installed := make(map[string]bool)
	for _, p := range a.GetInstalledPlugins() {
		installed[p] = true
	}

	catalog := []PluginInfo{
		{
			Name:        "hyper-snazzy",
			Description: "Elegant and vivid terminal theme with crisp syntax colors",
			Category:    "Theme",
			Installed:   installed["hyper-snazzy"],
			URL:         "https://github.com/sindresorhus/hyper-snazzy",
		},
		{
			Name:        "hypercwd",
			Description: "Opens new tabs with the current active directory from the previous tab",
			Category:    "Productivity",
			Installed:   installed["hypercwd"],
			URL:         "https://github.com/hharnisc/hypercwd",
		},
		{
			Name:        "hyper-search",
			Description: "Search text within the terminal buffer using Ctrl+Shift+F",
			Category:    "Productivity",
			Installed:   installed["hyper-search"],
			URL:         "https://github.com/zeit/hyper-search",
		},
		{
			Name:        "hyper-pane",
			Description: "Enhanced pane navigation and directional focus switching shortcuts",
			Category:    "Navigation",
			Installed:   installed["hyper-pane"],
			URL:         "https://github.com/chabou/hyper-pane",
		},
		{
			Name:        "hyperpower",
			Description: "Particle visual effects and cursor explosions when typing commands",
			Category:    "Visuals",
			Installed:   installed["hyperpower"],
			URL:         "https://github.com/zeit/hyperpower",
		},
	}
	return catalog
}

// CreateSSHSession initializes a remote SSH session
func (a *App) CreateSSHSession(host string, port int, user string, password string, keyPath string) (map[string]interface{}, error) {
	if a.sessions == nil {
		return nil, fmt.Errorf("session manager not initialized")
	}
	return a.sessions.CreateSSHSession(host, port, user, password, keyPath)
}

// ExportSessionSnapshot returns the active session snapshot as a JSON string
func (a *App) ExportSessionSnapshot() string {
	if a.sessions == nil {
		return `{"version":"1.1.0","sessions":[]}`
	}
	snap := a.sessions.ExportSnapshot()
	bytes, err := json.MarshalIndent(snap, "", "  ")
	if err != nil {
		return `{"error":"failed to serialize snapshot"}`
	}
	return string(bytes)
}

// InstallPlugin adds a plugin to configuration
func (a *App) InstallPlugin(name string) (bool, error) {
	if a.config == nil {
		return false, fmt.Errorf("config manager not initialized")
	}
	current := a.GetInstalledPlugins()
	for _, p := range current {
		if p == name {
			return true, nil // Already installed
		}
	}
	updated := append(current, name)
	err := a.config.SetConfigValue("plugins", updated)
	if err != nil {
		return false, fmt.Errorf("failed to save plugin config: %w", err)
	}
	return true, nil
}

// ---- Dialog Operations ----

func (a *App) OpenFileDialog(title string) (string, error) {
	if a.ctx != nil {
		return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
			Title: title,
		})
	}
	return "", fmt.Errorf("runtime context not ready")
}

func (a *App) SaveFileDialog(title string, defaultFilename string) (string, error) {
	if a.ctx != nil {
		return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
			Title:           title,
			DefaultFilename: defaultFilename,
		})
	}
	return "", fmt.Errorf("runtime context not ready")
}

func (a *App) MessageDialog(title, message string) {
	if a.ctx != nil {
		_, _ = runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Type:    runtime.InfoDialog,
			Title:   title,
			Message: message,
		})
	}
}

// ---- App Info ----

func (a *App) GetAppVersion() string {
	return "1.1.0"
}

func (a *App) GetAppName() string {
	return "TormentNexus"
}

// OpenConfigFile opens the config file
func (a *App) OpenConfigFile() error {
	configPath := a.config.GetConfigPath()
	return exec.Command("xdg-open", configPath).Start()
}
