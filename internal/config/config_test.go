package config

import (
	"encoding/json"
	"testing"
)

func TestDefaultConfigOptions(t *testing.T) {
	opts := ConfigOptions{
		UpdateChannel:  "stable",
		FontSize:       12,
		FontFamily:     "monospace",
		FontWeight:     "normal",
		FontWeightBold: "bold",
		LineHeight:     1.0,
		CursorShape:    "BLOCK",
		Colors: map[string]string{
			"black": "#000000",
			"white": "#ffffff",
		},
	}

	data, err := json.Marshal(opts)
	if err != nil {
		t.Fatalf("failed to marshal config: %v", err)
	}

	var parsed ConfigOptions
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal config: %v", err)
	}

	if parsed.FontSize != 12 || parsed.CursorShape != "BLOCK" {
		t.Errorf("unexpected parsed values: %+v", parsed)
	}
}
