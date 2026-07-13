package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/fsnotify/fsnotify"
)

type ConfigOptions struct {
	UpdateChannel          string            `json:"updateChannel"`
	FontSize               int               `json:"fontSize"`
	FontFamily             string            `json:"fontFamily"`
	FontWeight             string            `json:"fontWeight"`
	FontWeightBold         string            `json:"fontWeightBold"`
	LineHeight             float64           `json:"lineHeight"`
	LetterSpacing          float64           `json:"letterSpacing"`
	CursorColor            string            `json:"cursorColor"`
	CursorAccentColor      string            `json:"cursorAccentColor"`
	CursorShape            string            `json:"cursorShape"`
	CursorBlink            bool              `json:"cursorBlink"`
	ForegroundColor        string            `json:"foregroundColor"`
	BackgroundColor        string            `json:"backgroundColor"`
	SelectionColor         string            `json:"selectionColor"`
	BorderColor            string            `json:"borderColor"`
	CSS                    string            `json:"css"`
	TermCSS                string            `json:"termCSS"`
	WorkingDir             string            `json:"workingDir"`
	CopyOnSelect           bool              `json:"copyOnSelect"`
	DefaultShell           string            `json:"defaultShell"`
	ShellArgs              []string          `json:"shellArgs"`
	Env                    map[string]string `json:"env"`
	Bell                   string            `json:"bell"`
	QuickEdit              bool              `json:"quickEdit"`
	MacOptionSelectionMode string            `json:"macOptionSelectionMode"`
	WebGLRenderer          bool              `json:"webGLRenderer"`
	WebLinksActivationKey  string            `json:"webLinksActivationKey"`
	ModifierKeys           map[string]string `json:"modifierKeys"`
	Colors                 map[string]string `json:"colors"`
	DefaultProfile         string            `json:"defaultProfile"`
	Profiles               []Profile         `json:"profiles"`
}

type Profile struct {
	Name   string        `json:"name"`
	Config ConfigOptions `json:"config"`
}

type ParsedConfig struct {
	Config       ConfigOptions `json:"config"`
	Plugins      []string      `json:"plugins"`
	LocalPlugins []string      `json:"localPlugins"`
	Keymaps      interface{}   `json:"keymaps"`
}

var (
	cfg      ParsedConfig
	cfgMu    sync.RWMutex
	cfgPath  string
	watchers []func()
)

func Setup(path string) error {
	cfgPath = path
	err := Reload()
	if err != nil {
		return err
	}

	go watch()
	return nil
}

func Reload() error {
	data, err := os.ReadFile(cfgPath)
	if err != nil {
		return fmt.Errorf("failed to read config file: %w", err)
	}

	cfgMu.Lock()
	defer cfgMu.Unlock()
	err = json.Unmarshal(data, &cfg)
	if err != nil {
		return fmt.Errorf("failed to parse config file: %w", err)
	}

	for _, w := range watchers {
		w()
	}

	return nil
}

func GetConfig() ConfigOptions {
	cfgMu.RLock()
	defer cfgMu.RUnlock()
	return cfg.Config
}

func GetConfigDir() string {
	return filepath.Dir(cfgPath)
}

func watch() {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		fmt.Printf("Error creating watcher: %v\n", err)
		return
	}
	defer watcher.Close()

	err = watcher.Add(cfgPath)
	if err != nil {
		fmt.Printf("Error adding path to watcher: %v\n", err)
		return
	}

	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			if event.Op&fsnotify.Write == fsnotify.Write {
				fmt.Println("Config file modified, reloading...")
				Reload()
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			fmt.Printf("Watcher error: %v\n", err)
		}
	}
}

func Subscribe(fn func()) {
	cfgMu.Lock()
	defer cfgMu.Unlock()
	watchers = append(watchers, fn)
}
