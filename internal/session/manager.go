package session

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"sync"
	"time"

	"github.com/creack/pty"
)

type Session struct {
	ID         string
	Shell      string
	Args       []string
	CWD        string
	PTY        *os.File
	Cmd        *exec.Cmd
	mu         sync.Mutex
	closed     bool
	outputBuf  []string
	maxHistory int
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
		ID:         id,
		Shell:      shell,
		Args:       args,
		CWD:        cwd,
		PTY:        f,
		Cmd:        cmd,
		outputBuf:  make([]string, 0, 500),
		maxHistory: 500,
	}, nil
}

// AppendOutput appends raw or formatted lines to the session's memory buffer
func (s *Session) AppendOutput(text string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.outputBuf = append(s.outputBuf, text)
	if len(s.outputBuf) > s.maxHistory {
		s.outputBuf = s.outputBuf[len(s.outputBuf)-s.maxHistory:]
	}
}

// GetOutputTail returns the latest N lines of terminal output
func (s *Session) GetOutputTail(maxLines int) string {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.outputBuf) == 0 {
		return ""
	}
	start := 0
	if maxLines > 0 && len(s.outputBuf) > maxLines {
		start = len(s.outputBuf) - maxLines
	}
	var res string
	for i := start; i < len(s.outputBuf); i++ {
		if i > start {
			res += "\n"
		}
		res += s.outputBuf[i]
	}
	return res
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
		_ = s.Cmd.Process.Kill()
	}
	return nil
}

// Manager orchestrates all local active terminal sessions
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

// ListSessions returns a slice of all active session IDs
func (m *Manager) ListSessions() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	res := make([]string, 0, len(m.sessions))
	for id := range m.sessions {
		res = append(res, id)
	}
	return res
}

// Count returns the number of active sessions
func (m *Manager) Count() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.sessions)
}

// GetSessionOutput returns the tail output lines for the specified session
func (m *Manager) GetSessionOutput(id string, maxLines int) string {
	m.mu.RLock()
	sess := m.sessions[id]
	m.mu.RUnlock()
	if sess == nil {
		return ""
	}
	return sess.GetOutputTail(maxLines)
}

// CloseAll terminates all managed sessions safely
func (m *Manager) CloseAll() {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, sess := range m.sessions {
		if sess != nil {
			_ = sess.Close()
		}
	}
	m.sessions = make(map[string]*Session)
}

// SessionMetadata represents exported state and buffer of a session
type SessionMetadata struct {
	ID        string   `json:"id"`
	Shell     string   `json:"shell"`
	Args      []string `json:"args"`
	CWD       string   `json:"cwd"`
	OutputBuf []string `json:"output_buf"`
}

// SessionSnapshot contains serialized metadata of managed sessions
type SessionSnapshot struct {
	Version   string            `json:"version"`
	Timestamp int64             `json:"timestamp"`
	Sessions  []SessionMetadata `json:"sessions"`
}

// ExportSnapshot creates a deep copy snapshot of all managed sessions
func (m *Manager) ExportSnapshot() SessionSnapshot {
	m.mu.RLock()
	defer m.mu.RUnlock()

	snap := SessionSnapshot{
		Version:   "1.1.0",
		Timestamp: time.Now().Unix(),
		Sessions:  make([]SessionMetadata, 0, len(m.sessions)),
	}

	for _, s := range m.sessions {
		if s == nil {
			continue
		}
		s.mu.Lock()
		bufCopy := make([]string, len(s.outputBuf))
		copy(bufCopy, s.outputBuf)
		argsCopy := make([]string, len(s.Args))
		copy(argsCopy, s.Args)
		meta := SessionMetadata{
			ID:        s.ID,
			Shell:     s.Shell,
			Args:      argsCopy,
			CWD:       s.CWD,
			OutputBuf: bufCopy,
		}
		s.mu.Unlock()
		snap.Sessions = append(snap.Sessions, meta)
	}
	return snap
}

// SaveSnapshotToFile writes the session snapshot JSON to disk
func (m *Manager) SaveSnapshotToFile(path string) error {
	snap := m.ExportSnapshot()
	data, err := json.MarshalIndent(snap, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal session snapshot: %w", err)
	}
	return os.WriteFile(path, data, 0644)
}

// LoadSnapshotFromFile loads a session snapshot JSON from disk
func LoadSnapshotFromFile(path string) (*SessionSnapshot, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read snapshot file: %w", err)
	}
	var snap SessionSnapshot
	if err := json.Unmarshal(data, &snap); err != nil {
		return nil, fmt.Errorf("failed to unmarshal snapshot: %w", err)
	}
	return &snap, nil
}
