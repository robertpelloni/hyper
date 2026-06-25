package warp

import (
	"time"
	"github.com/google/uuid"
)

type CommandBlock struct {
	ID        string
	Command   string
	Stdout    string
	Stderr    string
	ExitCode  int
	StartTime int64
	EndTime   int64
	Cwd       string
}

type BlockManager struct {
	blocks []*CommandBlock
}

func NewBlockManager() *BlockManager {
	return &BlockManager{
		blocks: make([]*CommandBlock, 0),
	}
}

func (b *BlockManager) CreateBlock(command string, cwd string) *CommandBlock {
	block := &CommandBlock{
		ID:        uuid.New().String(),
		Command:   command,
		Stdout:    "",
		Stderr:    "",
		ExitCode:  -1,
		StartTime: time.Now().UnixMilli(),
		EndTime:   0,
		Cwd:       cwd,
	}
	b.blocks = append(b.blocks, block)
	return block
}

func (b *BlockManager) FinishBlock(id string, stdout string, stderr string, exitCode int) {
	for _, block := range b.blocks {
		if block.ID == id {
			block.Stdout = stdout
			block.Stderr = stderr
			block.ExitCode = exitCode
			block.EndTime = time.Now().UnixMilli()
			break
		}
	}
}

func (b *BlockManager) GetBlocks() []*CommandBlock {
	return b.blocks
}