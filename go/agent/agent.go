package agent

import (
	"tormentnexus/go/internal/codex"
	"tormentnexus/go/internal/warp"
)

type TormentAgent struct {
	warpManager *warp.BlockManager
	ghostText   *codex.GhostTextManager
}

func NewTormentAgent() *TormentAgent {
	return &TormentAgent{
		warpManager: warp.NewBlockManager(),
		ghostText:   codex.NewGhostTextManager(),
	}
}

func (a *TormentAgent) CreateCommandBlock(command string, cwd string) *warp.CommandBlock {
	return a.warpManager.CreateBlock(command, cwd)
}

func (a *TormentAgent) GetGhostSuggestion(input string) string {
	return a.ghostText.Suggest(input, len(input))
}
