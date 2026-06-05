package terminal

import (
	"sync"
)

type Buffer struct {
	content []string
	blocks  []CommandBlock
	mu      sync.RWMutex
}

type CommandBlock struct {
	Command string
	Output  string
	Status  int
}

func NewBuffer() *Buffer {
	return &Buffer{
		content: make([]string, 0),
		blocks:  make([]CommandBlock, 0),
	}
}

func (b *Buffer) AddBlock(cmd string, output string, status int) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.blocks = append(b.blocks, CommandBlock{
		Command: cmd,
		Output:  output,
		Status:  status,
	})
}

func (b *Buffer) GetBlocks() []CommandBlock {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.blocks
}
