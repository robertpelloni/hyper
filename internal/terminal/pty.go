package terminal

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
)

type PTYManager struct {
	instances map[string]*PTYInstance
	mu        sync.RWMutex
}

type PTYInstance struct {
	ID   string
	Pty  *os.File
	Cmd  *exec.Cmd
	done chan struct{}
}

func NewPTYManager() *PTYManager {
	return &PTYManager{
		instances: make(map[string]*PTYInstance),
	}
}

func (m *PTYManager) Start(id, shell string, args []string, rows, cols uint16) error {
	cmd := exec.Command(shell, args...)
	f, err := pty.StartWithAttrs(cmd, &pty.Winsize{Rows: rows, Cols: cols}, nil)
	if err != nil {
		return err
	}

	instance := &PTYInstance{
		ID:   id,
		Pty:  f,
		Cmd:  cmd,
		done: make(chan struct{}),
	}

	m.mu.Lock()
	m.instances[id] = instance
	m.mu.Unlock()

	go instance.readLoop()

	return nil
}

type CommandBlockData struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Data string `json:"data"` // base64 encoded
}

func (i *PTYInstance) readLoop() {
	buf := make([]byte, 32*1024)
	for {
		n, err := i.Pty.Read(buf)
		if n > 0 {
			// In a real implementation, we'd send this to the frontend
			strData := base64.StdEncoding.EncodeToString(buf[:n])
			block := CommandBlockData{
				ID:   i.ID,
				Type: "output",
				Data: strData,
			}
			blockJson, _ := json.Marshal(block)
			fmt.Println("PTY_BLOCK:", string(blockJson))
			// Data would be transmitted via callback or channel
		}
		if err != nil {
			break
		}
	}
	close(i.done)
}

func (m *PTYManager) Write(id string, data []byte) error {
	m.mu.RLock()
	instance, ok := m.instances[id]
	m.mu.RUnlock()
	if !ok {
		return fmt.Errorf("instance not found")
	}
	_, err := instance.Pty.Write(data)
	return err
}

func (m *PTYManager) Resize(id string, rows, cols uint16) error {
	m.mu.RLock()
	instance, ok := m.instances[id]
	m.mu.RUnlock()
	if !ok {
		return fmt.Errorf("instance not found")
	}
	return pty.Setsize(instance.Pty, &pty.Winsize{Rows: rows, Cols: cols})
}
