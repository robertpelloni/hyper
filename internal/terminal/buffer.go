package terminal

import (
	"strings"
	"sync"
	"time"
)

// Block represents a single semantic command execution block with status and timing
type Block struct {
	ID        int64     `json:"id"`
	Command   string    `json:"command"`
	Output    string    `json:"output"`
	Success   bool      `json:"success"`
	Timestamp time.Time `json:"timestamp"`
}

// Buffer holds an in-memory history of terminal command blocks with thread-safe search
type Buffer struct {
	Blocks []Block
	mu     sync.RWMutex
}

// NewBuffer creates an initialized Buffer
func NewBuffer() *Buffer {
	return &Buffer{
		Blocks: make([]Block, 0),
	}
}

// AddBlock appends a new command block with timestamp and generated sequence ID
func (b *Buffer) AddBlock(cmd, output string, success bool) Block {
	b.mu.Lock()
	defer b.mu.Unlock()

	block := Block{
		ID:        time.Now().UnixNano(),
		Command:   cmd,
		Output:    output,
		Success:   success,
		Timestamp: time.Now(),
	}
	b.Blocks = append(b.Blocks, block)
	return block
}

// GetBlocks returns a snapshot slice of all recorded command blocks
func (b *Buffer) GetBlocks() []Block {
	b.mu.RLock()
	defer b.mu.RUnlock()

	res := make([]Block, len(b.Blocks))
	copy(res, b.Blocks)
	return res
}

// SearchBlocks searches command blocks by matching keyword against command or output
func (b *Buffer) SearchBlocks(keyword string) []Block {
	b.mu.RLock()
	defer b.mu.RUnlock()

	if keyword == "" {
		res := make([]Block, len(b.Blocks))
		copy(res, b.Blocks)
		return res
	}

	lower := strings.ToLower(keyword)
	var matches []Block
	for _, blk := range b.Blocks {
		if strings.Contains(strings.ToLower(blk.Command), lower) ||
			strings.Contains(strings.ToLower(blk.Output), lower) {
			matches = append(matches, blk)
		}
	}
	return matches
}

// Clear flushes all stored command blocks
func (b *Buffer) Clear() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.Blocks = make([]Block, 0)
}
