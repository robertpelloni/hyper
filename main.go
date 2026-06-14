package main

import (
	"embed"
	"log"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
)

//go:embed all:frontend/dist
var frontendAssets embed.FS

func main() {
	// Initialize the application core
	app := NewApp()
	// Initialize session manager
	sessions := NewSessionManager()
	// Initialize config
	cfg := NewConfigManager()
	// Initialize agent harness
	agent := NewAgentHarness()
	// Initialize MCP aggregator
	mcp := NewMCPAggregator()

	// Create application with options
	application := wails.Run(&options.App{
		Title:  "TormentNexus",
		Width:  1024,
		Height: 768,
		MinWidth: 370,
		MinHeight: 190,
		AssetServer: &assetserver.Options{
			Assets: frontendAssets,
		},
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 1},
		OnStartup:  app.startup,
		OnShutdown: app.shutdown,
		OnBeforeClose: app.beforeClose,
		Bind: []interface{}{
			app,
			sessions,
			cfg,
			agent,
			mcp,
		},
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
		},
		Linux: &linux.Options{
			Icon: []byte{},
		},
	})

	if application != nil {
		log.Println("TormentNexus exited with error:", application)
		os.Exit(1)
	}
}
