package main

import (
	"embed"
	"log"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var frontendAssets embed.FS

func main() {
	app := NewApp()
	sessions := NewSessionManager()
	cfg := NewConfigManager()
	agent := NewAgentHarness()
	mcp := NewMCPAggregator()

	appMenu := menu.NewMenu()
	fileMenu := appMenu.AddSubmenu("TormentNexus")
	fileMenu.AddText("Toggle Window", keys.CmdOrCtrl("w"), func(_ *menu.CallbackData) {
		app.WindowToggleMaximise()
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Restart Servers", keys.CmdOrCtrl("r"), func(_ *menu.CallbackData) {
		app.RestartServers()
	})
	fileMenu.AddText("Stop Servers", nil, func(_ *menu.CallbackData) {
		app.StopServers()
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Quit TormentNexus", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		app.QuitApp()
	})

	serverMenu := appMenu.AddSubmenu("Servers & Agent")
	serverMenu.AddText("Start Agent Harness", nil, func(_ *menu.CallbackData) {
		agent.ExecuteCommand("start")
	})
	serverMenu.AddText("Stop Agent Harness", nil, func(_ *menu.CallbackData) {
		agent.ExecuteCommand("stop")
	})
	serverMenu.AddSeparator()
	serverMenu.AddText("Restart MCP Server (:8080)", nil, func(_ *menu.CallbackData) {
		app.RestartServers()
	})

	application := wails.Run(&options.App{
		Title:     "TormentNexus",
		Width:     1120,
		Height:    800,
		MinWidth:  370,
		MinHeight: 190,
		Menu:      appMenu,
		AssetServer: &assetserver.Options{
			Assets: frontendAssets,
		},
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		OnBeforeClose:    app.beforeClose,
		Bind: []interface{}{
			app,
			sessions,
			cfg,
			agent,
			mcp,
		},
		Mac: &mac.Options{
			TitleBar:             mac.TitleBarHiddenInset(),
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
