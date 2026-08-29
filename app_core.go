package main

import (
	"context"
	"os"
	"os/exec"

	"github.com/wailsapp/wails/v2/pkg/runtime" // wails runtime for window/events/dialogs
)

// App is the main application struct for Wails
type App struct {
	ctx      context.Context
	sessions *SessionManager
	config   *ConfigManager
	agent    *AgentHarness
	mcp      *MCPAggregator
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.sessions = NewSessionManager()
	a.sessions.SetRuntime(a)
	a.config = NewConfigManager()
	a.mcp = NewMCPAggregator()
	a.agent = NewAgentHarness(a.mcp)
}

func (a *App) shutdown(ctx context.Context) {
	if a.sessions != nil {
		a.sessions.CloseAll()
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

// ---- Window Controls ----

func (a *App) WindowMinimise() {
	runtime.WindowMinimise(a.ctx)
}

func (a *App) WindowMaximise() {
	runtime.WindowMaximise(a.ctx)
}

func (a *App) WindowUnmaximise() {
	runtime.WindowUnmaximise(a.ctx)
}

func (a *App) WindowToggleMaximise() {
	runtime.WindowToggleMaximise(a.ctx)
}

func (a *App) WindowClose() {
	runtime.Quit(a.ctx)
}

func (a *App) WindowIsMaximised() bool {
	return runtime.WindowIsMaximised(a.ctx)
}

func (a *App) WindowFullscreen() {
	runtime.WindowFullscreen(a.ctx)
}

func (a *App) WindowUnfullscreen() {
	runtime.WindowUnfullscreen(a.ctx)
}

func (a *App) WindowIsFullscreen() bool {
	return runtime.WindowIsFullscreen(a.ctx)
}

func (a *App) WindowSetSize(width, height int) {
	runtime.WindowSetSize(a.ctx, width, height)
}

func (a *App) WindowSetPosition(x, y int) {
	runtime.WindowSetPosition(a.ctx, x, y)
}

func (a *App) WindowGetPosition() (int, int) {
	return runtime.WindowGetPosition(a.ctx)
}

func (a *App) WindowGetSize() (int, int) {
	return runtime.WindowGetSize(a.ctx)
}

// ---- System Operations ----

func (a *App) OpenURL(url string) {
	runtime.BrowserOpenURL(a.ctx, url)
}

func (a *App) GetPlatform() string {
	return "windows"
}

func (a *App) GetHomeDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "C:\\"
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

// ---- Dialog Operations ----

func (a *App) OpenFileDialog(title string) (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
}

func (a *App) SaveFileDialog(title string, defaultFilename string) (string, error) {
	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           title,
		DefaultFilename: defaultFilename,
	})
}

func (a *App) MessageDialog(title, message string) {
	_, _ = runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:    runtime.InfoDialog,
		Title:   title,
		Message: message,
	})
}

// ---- App Info ----

func (a *App) GetAppVersion() string {
	return "1.0.0"
}

func (a *App) GetAppName() string {
	return "TormentNexus"
}

// OpenConfigFile opens the config file in Notepad
func (a *App) OpenConfigFile() error {
	configPath := a.config.GetConfigPath()
	return exec.Command("notepad", configPath).Start()
}
