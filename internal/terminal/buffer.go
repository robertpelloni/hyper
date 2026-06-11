package terminal

import (
	"io"
	"os"
	"os/exec"
	"sync"
	"time"

	"github.com/creack/pty"
)

type BlockStatus int

const (
	BlockRunning BlockStatus = iota
	BlockSuccess
	BlockError
)

type Block struct {
	ID        string      `json:"id"`
	Command   string      `json:"command"`
	Output    string      `json:"output"`
	Status    BlockStatus `json:"status"`
	StartTime time.Time   `json:"start_time"`
	EndTime   time.Time   `json:"end_time"`
}

type Buffer struct {
	mu            sync.RWMutex
	blocks        []*Block
	activeBlock   *Block
	currentOutput string
}

func NewBuffer() *Buffer {
	return &Buffer{
		blocks: make([]*Block, 0),
	}
}

// StartCommand initiates a new command block.
func (b *Buffer) StartCommand(id string, command string) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.activeBlock != nil {
		b.finalizeActiveBlock()
	}

	block := &Block{
		ID:        id,
		Command:   command,
		Status:    BlockRunning,
		StartTime: time.Now(),
	}
	b.activeBlock = block
	b.blocks = append(b.blocks, block)
	b.currentOutput = ""
}

// AppendOutput adds data to the current active block.
func (b *Buffer) AppendOutput(data string) {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.currentOutput += data
	if b.activeBlock != nil {
		b.activeBlock.Output = b.currentOutput
	}
}

// EndCommand finalizes the current active block with an exit status.
func (b *Buffer) EndCommand(exitCode int) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.activeBlock == nil {
		return
	}

	b.activeBlock.EndTime = time.Now()
	if exitCode == 0 {
		b.activeBlock.Status = BlockSuccess
	} else {
		b.activeBlock.Status = BlockError
	}
	b.activeBlock = nil
	b.currentOutput = ""
}

func (b *Buffer) finalizeActiveBlock() {
	b.activeBlock.EndTime = time.Now()
	b.activeBlock.Status = BlockError // Assumed interrupted
	b.activeBlock = nil
	b.currentOutput = ""
}

func (b *Buffer) GetBlocks() []*Block {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.blocks
}

type Session struct {
	pty    *os.File
	cmd    *exec.Cmd
	buffer *Buffer
}

func NewSession(command string, args []string) (*Session, error) {
	c := exec.Command(command, args...)
	f, err := pty.Start(c)
	if err != nil {
		return nil, err
	}

	session := &Session{
		pty:    f,
		cmd:    c,
		buffer: NewBuffer(),
	}

	// Capture PTY output into the buffer
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := f.Read(buf)
			if n > 0 {
				session.buffer.AppendOutput(string(buf[:n]))
			}
			if err != nil {
				if err != io.EOF {
					// handle error
				}
				break
			}
		}
	}()

	return session, nil
}

func (s *Session) Close() error {
	if s.pty != nil {
		s.pty.Close()
	}
	if s.cmd != nil && s.cmd.Process != nil {
		s.cmd.Process.Kill()
	}
	return nil
}
