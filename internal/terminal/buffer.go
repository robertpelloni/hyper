package terminal

import (
	"sync"
	"time"
	"github.com/google/uuid"
)

type Buffer struct {
	content []string
	blocks  []CommandBlock
	mu      sync.RWMutex
}

type CommandBlock struct {
	ID        string    `json:"id"`
	Command   string    `json:"command"`
	Output    string    `json:"output"`
	Status    int       `json:"status"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
}

func NewBuffer() *Buffer {
	return &Buffer{
		content: make([]string, 0),
		blocks:  make([]CommandBlock, 0),
	}
}

func (b *Buffer) AddBlock(cmd string, output string, status int, start time.Time, end time.Time) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.blocks = append(b.blocks, CommandBlock{
		ID:        uuid.NewString(),
		Command:   cmd,
		Output:    output,
		Status:    status,
		StartTime: start,
		EndTime:   end,
	})
}

func (b *Buffer) GetBlocks() []CommandBlock {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.blocks
}
