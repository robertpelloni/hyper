package session

import (
	"fmt"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
)

type Session struct {
	ID     string
	Shell  string
	Args   []string
	CWD    string
	PTY    *os.File
	Cmd    *exec.Cmd
	mu     sync.Mutex
	closed bool
}

func NewSession(id, shell string, args []string, cwd string, rows, cols uint16) (*Session, error) {
	cmd := exec.Command(shell, args...)
	cmd.Dir = cwd
	cmd.Env = os.Environ()

	f, err := pty.StartWithAttrs(cmd, &pty.Winsize{Rows: rows, Cols: cols}, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start pty: %w", err)
	}

	return &Session{
		ID:    id,
		Shell: shell,
		Args:  args,
		CWD:   cwd,
		PTY:   f,
		Cmd:   cmd,
	}, nil
}

func (s *Session) Write(data []byte) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.closed {
		return 0, fmt.Errorf("session closed")
	}
	return s.PTY.Write(data)
}

func (s *Session) Read(p []byte) (int, error) {
	return s.PTY.Read(p)
}

func (s *Session) Resize(rows, cols uint16) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.closed {
		return fmt.Errorf("session closed")
	}
	return pty.Setsize(s.PTY, &pty.Winsize{Rows: rows, Cols: cols})
}

func (s *Session) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.closed {
		return nil
	}
	s.closed = true
	s.PTY.Close()
	if s.Cmd.Process != nil {
		s.Cmd.Process.Kill()
	}
	return nil
}

type Manager struct {
	sessions map[string]*Session
	mu       sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		sessions: make(map[string]*Session),
	}
}

func (m *Manager) AddSession(s *Session) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sessions[s.ID] = s
}

func (m *Manager) GetSession(id string) *Session {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.sessions[id]
}

func (m *Manager) RemoveSession(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.sessions, id)
}
