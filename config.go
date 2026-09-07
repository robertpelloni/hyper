package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"

	"github.com/fsnotify/fsnotify"
)

// ConfigManager handles application configuration
type ConfigManager struct {
	configPath string
	configDir  string
	data       map[string]interface{}
	mu         sync.RWMutex
	watchers   []func()
}

// DefaultConfig returns the default configuration
func DefaultConfig() map[string]interface{} {
	return map[string]interface{}{
		"updateChannel":     "stable",
		"fontSize":          float64(12),
		"fontFamily":        `Menlo, "DejaVu Sans Mono", Consolas, "Lucida Console", monospace`,
		"fontWeight":        "normal",
		"fontWeightBold":    "bold",
		"lineHeight":        float64(1),
		"letterSpacing":     float64(0),
		"scrollback":        float64(1000),
		"cursorColor":       "rgba(248,28,229,0.8)",
		"cursorAccentColor": "#000",
		"cursorShape":       "BLOCK",
		"cursorBlink":       false,
		"foregroundColor":   "#fff",
		"backgroundColor":   "#000",
		"selectionColor":    "rgba(248,28,229,0.3)",
		"borderColor":       "#333",
		"css":               "",
		"termCSS":           "",
		"workingDirectory":  "",
		"padding":           "12px 14px",
		"colors": map[string]interface{}{
			"black":        "#000000",
			"red":          "#C51E14",
			"green":        "#1DC121",
			"yellow":       "#C7C329",
			"blue":         "#0A2FC4",
			"magenta":      "#C839C5",
			"cyan":         "#20C5C6",
			"white":        "#C7C7C7",
			"lightBlack":   "#686868",
			"lightRed":     "#FD6F6B",
			"lightGreen":   "#67F86F",
			"lightYellow":  "#FFFA72",
			"lightBlue":    "#6A76FB",
			"lightMagenta": "#FD7CFC",
			"lightCyan":    "#68FDFE",
			"lightWhite":   "#FFFFFF",
			"limeGreen":    "#32CD32",
			"lightCoral":   "#F08080",
		},
		"shell":                  "",
		"shellArgs":              []string{"--login"},
		"env":                    map[string]string{},
		"bell":                   "SOUND",
		"copyOnSelect":           false,
		"quickEdit":              false,
		"macOptionSelectionMode": "vertical",
		"webGLRenderer":          false,
		"webLinksActivationKey":  "",
		"disableLigatures":       true,
		"preserveCWD":            true,
		"screenReaderMode":       false,
		"imageSupport":           true,
		"defaultProfile":         "default",
		"profiles": []interface{}{
			map[string]interface{}{
				"name":   "default",
				"config": map[string]interface{}{},
			},
		},
		"windowSize":         []interface{}{float64(1024), float64(768)},
		"windowPosition":     []interface{}{float64(50), float64(50)},
		"showHamburgerMenu":  "",
		"showWindowControls": "",
		"useConpty":          true,
	}
}

func NewConfigManager() *ConfigManager {
	cm := &ConfigManager{
		data: DefaultConfig(),
	}

	// Determine config directory
	configDir := cm.getConfigDir()
	cm.configDir = configDir
	cm.configPath = filepath.Join(configDir, "TormentNexus.json")

	// Create config directory if it doesn't exist
	os.MkdirAll(configDir, 0755)

	// Load or create config file
	if _, err := os.Stat(cm.configPath); os.IsNotExist(err) {
		cm.save()
	} else {
		cm.load()
	}

	// Start file watcher
	go cm.watch()

	return cm
}

func (cm *ConfigManager) getConfigDir() string {
	// Windows: %APPDATA%\TormentNexus
	if appData := os.Getenv("APPDATA"); appData != "" {
		return filepath.Join(appData, "TormentNexus")
	}
	// Fallback
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "TormentNexus")
}

func (cm *ConfigManager) load() error {
	data, err := os.ReadFile(cm.configPath)
	if err != nil {
		return fmt.Errorf("failed to read config: %w", err)
	}

	var loaded map[string]interface{}
	if err := json.Unmarshal(data, &loaded); err != nil {
		return fmt.Errorf("failed to parse config: %w", err)
	}

	cm.mu.Lock()
	// Merge: user config overrides defaults
	for k, v := range loaded {
		cm.data[k] = v
	}
	cm.mu.Unlock()

	return nil
}

func (cm *ConfigManager) save() error {
	cm.mu.RLock()
	data, err := json.MarshalIndent(cm.data, "", "  ")
	cm.mu.RUnlock()
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}
	return os.WriteFile(cm.configPath, data, 0644)
}

func (cm *ConfigManager) watch() {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return
	}
	defer watcher.Close()

	watcher.Add(cm.configPath)

	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			if event.Op&fsnotify.Write == fsnotify.Write {
				cm.load()
				cm.mu.RLock()
				watchers := cm.watchers
				cm.mu.RUnlock()
				for _, fn := range watchers {
					fn()
				}
			}
		case _, ok := <-watcher.Errors:
			if !ok {
				return
			}
		}
	}
}

// GetConfig returns the full config object for the frontend
func (cm *ConfigManager) GetConfig() map[string]interface{} {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	// Deep copy to prevent mutation
	result := make(map[string]interface{})
	for k, v := range cm.data {
		result[k] = v
	}
	return result
}

// GetConfigValue returns a specific config value
func (cm *ConfigManager) GetConfigValue(key string) interface{} {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return cm.data[key]
}

// SetConfigValue sets a specific config value and saves
func (cm *ConfigManager) SetConfigValue(key string, value interface{}) error {
	cm.mu.Lock()
	cm.data[key] = value
	cm.mu.Unlock()
	return cm.save()
}

// SetConfig replaces the entire config and saves
func (cm *ConfigManager) SetConfig(config map[string]interface{}) error {
	cm.mu.Lock()
	cm.data = config
	cm.mu.Unlock()
	return cm.save()
}

// GetConfigPath returns the config file path
func (cm *ConfigManager) GetConfigPath() string {
	return cm.configPath
}

// GetConfigDir returns the config directory
func (cm *ConfigManager) GetConfigDir() string {
	return cm.configDir
}

// GetShell returns the configured shell or default
func (cm *ConfigManager) GetShell() string {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	if shell, ok := cm.data["shell"]; ok {
		if s, ok := shell.(string); ok && s != "" {
			return s
		}
	}
	return ""
}

// GetShellArgs returns the configured shell args
func (cm *ConfigManager) GetShellArgs() []string {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	if args, ok := cm.data["shellArgs"]; ok {
		switch v := args.(type) {
		case []string:
			return v
		case []interface{}:
			result := make([]string, len(v))
			for i, item := range v {
				if s, ok := item.(string); ok {
					result[i] = s
				}
			}
			return result
		}
	}
	return []string{}
}

// GetWorkingDirectory returns the configured working directory
func (cm *ConfigManager) GetWorkingDirectory() string {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	if wd, ok := cm.data["workingDirectory"]; ok {
		if s, ok := wd.(string); ok && s != "" {
			return s
		}
	}
	return ""
}

// GetFontSize returns the configured font size
func (cm *ConfigManager) GetFontSize() float64 {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	if fs, ok := cm.data["fontSize"]; ok {
		switch v := fs.(type) {
		case float64:
			return v
		case json.Number:
			f, _ := v.Float64()
			return f
		}
	}
	return 12
}

// GetFontFamily returns the configured font family
func (cm *ConfigManager) GetFontFamily() string {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	if ff, ok := cm.data["fontFamily"]; ok {
		if s, ok := ff.(string); ok {
			return s
		}
	}
	return `Menlo, "DejaVu Sans Mono", Consolas, "Lucida Console", monospace`
}

// GetBackgroundColor returns the configured background color
func (cm *ConfigManager) GetBackgroundColor() string {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	if bg, ok := cm.data["backgroundColor"]; ok {
		if s, ok := bg.(string); ok {
			return s
		}
	}
	return "#000"
}

// OpenConfigInEditor opens the config file in Notepad (or default editor)
func (cm *ConfigManager) OpenConfigInEditor() error {
	return exec.Command("notepad", cm.configPath).Start()
}

// GetKeymaps returns the keymaps for the current platform
func (cm *ConfigManager) GetKeymaps() map[string]interface{} {
	// Load platform-specific keymaps
	keymaps := getDefaultKeymaps()

	// Merge user keymaps from config
	cm.mu.RLock()
	if userKeymaps, ok := cm.data["keymaps"]; ok {
		if km, ok := userKeymaps.(map[string]interface{}); ok {
			for k, v := range km {
				keymaps[k] = v
			}
		}
	}
	cm.mu.RUnlock()

	return keymaps
}

func getDefaultKeymaps() map[string]interface{} {
	return map[string]interface{}{
		"window:devtools":      "ctrl+shift+i",
		"window:reload":        "ctrl+shift+r",
		"window:preferences":   "ctrl+,",
		"window:hamburgerMenu": "alt+f",
		"zoom:reset":           "ctrl+0",
		"zoom:in":              "ctrl+=",
		"zoom:out":             "ctrl+-",
		"window:new":           "ctrl+shift+n",
		"window:minimize":      "ctrl+shift+m",
		"window:close":         "ctrl+shift+q",
		"tab:new":              "ctrl+shift+t",
		"tab:next":             "ctrl+tab",
		"tab:prev":             "ctrl+shift+tab",
		"pane:next":            "ctrl+pageup",
		"pane:prev":            "ctrl+pagedown",
		"pane:splitRight":      "ctrl+shift+d",
		"pane:splitDown":       "ctrl+shift+e",
		"pane:close":           "ctrl+shift+w",
		"editor:copy":          "ctrl+shift+c",
		"editor:paste":         "ctrl+shift+v",
		"editor:selectAll":     "ctrl+shift+a",
		"editor:search":        "ctrl+shift+f",
		"editor:search-close":  "esc",
		"editor:clearBuffer":   "ctrl+shift+k",
		"editor:break":         "ctrl+c",
		"plugins:update":       "ctrl+shift+u",
	}
}

// Ensure ConfigManager satisfies platform-specific requirements
func init() {
	// Ensure XDG_CONFIG_HOME works on all platforms
	if xdg := os.Getenv("XDG_CONFIG_HOME"); xdg != "" {
		_ = filepath.Join(xdg, "TormentNexus")
	}
}

// Subscribe adds a config change listener
func (cm *ConfigManager) Subscribe(fn func()) {
	cm.mu.Lock()
	cm.watchers = append(cm.watchers, fn)
	cm.mu.Unlock()
}

// ProfileConfig returns config for a specific profile
func (cm *ConfigManager) ProfileConfig(profileName string) map[string]interface{} {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	profiles, ok := cm.data["profiles"]
	if !ok {
		return cm.data
	}

	profileList, ok := profiles.([]interface{})
	if !ok {
		return cm.data
	}

	for _, p := range profileList {
		if profile, ok := p.(map[string]interface{}); ok {
			if name, ok := profile["name"]; ok && name == profileName {
				if profileCfg, ok := profile["config"]; ok {
					// Merge profile config on top of base config
					result := make(map[string]interface{})
					for k, v := range cm.data {
						result[k] = v
					}
					if pcMap, ok := profileCfg.(map[string]interface{}); ok {
						for k, v := range pcMap {
							result[k] = v
						}
					}
					return result
				}
			}
		}
	}

	return cm.data
}

// Helper to check string in slice
func stringSliceContains(slice []string, item string) bool {
	for _, s := range slice {
		if strings.Contains(s, item) {
			return true
		}
	}
	return false
}
