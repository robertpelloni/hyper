package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/creack/pty"
	"github.com/google/uuid"
)

// Session represents a single PTY session
type Session struct {
	ID        string `json:"id"`
	Shell     string `json:"shell"`
	Pid       int    `json:"pid"`
	Cwd       string `json:"cwd"`
	Profile   string `json:"profile"`
	Rows      uint16 `json:"rows"`
	Cols      uint16 `json:"cols"`
	ptyFile   *os.File
	cmd       *exec.Cmd
	mu        sync.Mutex
	closed    bool
	dataChans []chan []byte
	onExit    func()
}

// SessionManager manages all PTY sessions
type SessionManager struct {
	sessions map[string]*Session
	mu       sync.RWMutex
	ctx      context.Context
	runtime  *App
}

func NewSessionManager() *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
	}
}

func (sm *SessionManager) SetRuntime(app *App) {
	sm.runtime = app
}

// CreateSession creates a new PTY session and returns its info
func (sm *SessionManager) CreateSession(shell string, args []string, cwd string, rows uint16, cols uint16, profile string) (map[string]interface{}, error) {
	if shell == "" {
		shell = getDefaultShell()
	}
	if rows == 0 {
		rows = 24
	}
	if cols == 0 {
		cols = 80
	}

	id := uuid.New().String()

	cmd := exec.Command(shell, args...)
	if cwd != "" {
		cmd.Dir = cwd
	}
	cmd.Env = os.Environ()

	// Set terminal environment variables
	env := cmd.Env
	env = append(env,
		"TERM=xterm-256color",
		"COLORTERM=truecolor",
		"TERM_PROGRAM=TormentNexus",
		"TERM_PROGRAM_VERSION=1.0.0",
	)
	cmd.Env = dedupeEnv(env)

	f, err := pty.StartWithAttrs(cmd, &pty.Winsize{Rows: rows, Cols: cols}, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start pty: %w", err)
	}

	sess := &Session{
		ID:      id,
		Shell:   shell,
		Pid:     cmd.Process.Pid,
		Cwd:     cwd,
		Profile: profile,
		Rows:    rows,
		Cols:    cols,
		ptyFile: f,
		cmd:     cmd,
		closed:  false,
	}

	sm.mu.Lock()
	sm.sessions[id] = sess
	sm.mu.Unlock()

	// Start reading PTY output in background
	go sm.readLoop(sess)

	// Watch for process exit
	go sm.watchExit(sess)

	result := map[string]interface{}{
		"uid":     id,
		"shell":   shell,
		"pid":     cmd.Process.Pid,
		"rows":    rows,
		"cols":    cols,
		"profile": profile,
	}

	return result, nil
}

// readLoop reads data from the PTY and emits it to the frontend
func (sm *SessionManager) readLoop(sess *Session) {
	buf := make([]byte, 32*1024)
	for {
		n, err := sess.ptyFile.Read(buf)
		if n > 0 {
			data := string(buf[:n])
			if sm.runtime != nil {
				sm.runtime.EmitEvent("session:data:"+sess.ID, data)
			}
		}
		if err != nil {
			break
		}
	}
}

// watchExit monitors the PTY process for exit
func (sm *SessionManager) watchExit(sess *Session) {
	err := sess.cmd.Wait()
	_ = err
	sess.mu.Lock()
	sess.closed = true
	sess.mu.Unlock()

	if sm.runtime != nil {
		sm.runtime.EmitEvent("session:exit:"+sess.ID, sess.ID)
	}

	sm.mu.Lock()
	delete(sm.sessions, sess.ID)
	sm.mu.Unlock()
}

// WriteData writes data to a session's PTY
func (sm *SessionManager) WriteData(id string, data string) error {
	sm.mu.RLock()
	sess, ok := sm.sessions[id]
	sm.mu.RUnlock()

	if !ok {
		return fmt.Errorf("session not found: %s", id)
	}

	sess.mu.Lock()
	defer sess.mu.Unlock()
	if sess.closed {
		return fmt.Errorf("session closed")
	}

	_, err := sess.ptyFile.Write([]byte(data))
	return err
}

// ResizeSession resizes a session's PTY
func (sm *SessionManager) ResizeSession(id string, rows uint16, cols uint16) error {
	sm.mu.RLock()
	sess, ok := sm.sessions[id]
	sm.mu.RUnlock()

	if !ok {
		return fmt.Errorf("session not found: %s", id)
	}

	sess.mu.Lock()
	defer sess.mu.Unlock()
	if sess.closed {
		return fmt.Errorf("session closed")
	}

	sess.Rows = rows
	sess.Cols = cols
	return pty.Setsize(sess.ptyFile, &pty.Winsize{Rows: rows, Cols: cols})
}

// CloseSession kills a session
func (sm *SessionManager) CloseSession(id string) error {
	sm.mu.Lock()
	sess, ok := sm.sessions[id]
	if !ok {
		sm.mu.Unlock()
		return fmt.Errorf("session not found: %s", id)
	}
	delete(sm.sessions, id)
	sm.mu.Unlock()

	sess.mu.Lock()
	defer sess.mu.Unlock()
	if sess.closed {
		return nil
	}
	sess.closed = true
	sess.ptyFile.Close()
	if sess.cmd.Process != nil {
		sess.cmd.Process.Kill()
	}
	return nil
}

// GetSession returns session info
func (sm *SessionManager) GetSession(id string) map[string]interface{} {
	sm.mu.RLock()
	sess, ok := sm.sessions[id]
	sm.mu.RUnlock()

	if !ok {
		return nil
	}

	return map[string]interface{}{
		"uid":     sess.ID,
		"shell":   sess.Shell,
		"pid":     sess.Pid,
		"cwd":     sess.Cwd,
		"profile": sess.Profile,
		"rows":    sess.Rows,
		"cols":    sess.Cols,
	}
}

// ListSessions returns all active sessions
func (sm *SessionManager) ListSessions() []map[string]interface{} {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	result := make([]map[string]interface{}, 0, len(sm.sessions))
	for _, sess := range sm.sessions {
		result = append(result, map[string]interface{}{
			"uid":     sess.ID,
			"shell":   sess.Shell,
			"pid":     sess.Pid,
			"profile": sess.Profile,
		})
	}
	return result
}

// CloseAll closes all sessions
func (sm *SessionManager) CloseAll() {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	for id, sess := range sm.sessions {
		sess.mu.Lock()
		if !sess.closed {
			sess.closed = true
			sess.ptyFile.Close()
			if sess.cmd.Process != nil {
				sess.cmd.Process.Kill()
			}
		}
		sess.mu.Unlock()
		delete(sm.sessions, id)
	}
}

// getDefaultShell returns the default shell for the current platform
func getDefaultShell() string {
	if runtime.GOOS == "windows" {
		// Try PowerShell first, fall back to cmd
		if psh, err := exec.LookPath("powershell"); err == nil {
			return psh
		}
		if pwsh, err := exec.LookPath("pwsh"); err == nil {
			return pwsh
		}
		return "cmd.exe"
	}
	// Unix: check SHELL env var, fallback to /bin/sh
	if shell := os.Getenv("SHELL"); shell != "" {
		return shell
	}
	return "/bin/sh"
}

// dedupeEnv removes duplicate env vars (last one wins)
func dedupeEnv(env []string) []string {
	seen := make(map[string]int)
	for i, e := range env {
		parts := strings.SplitN(e, "=", 2)
		seen[parts[0]] = i
	}
	result := make([]string, 0, len(env))
	for i, e := range env {
		parts := strings.SplitN(e, "=", 2)
		if seen[parts[0]] == i {
			result = append(result, e)
		}
	}
	return result
}

// WaitUntilExit waits for session to exit (for cleanup)
func (sm *SessionManager) WaitUntilExit(id string, timeout time.Duration) {
	sm.mu.RLock()
	sess, ok := sm.sessions[id]
	sm.mu.RUnlock()
	if ok && sess.cmd.Process != nil {
		done := make(chan error, 1)
		go func() {
			done <- sess.cmd.Wait()
		}()
		select {
		case <-done:
		case <-time.After(timeout):
			sess.cmd.Process.Kill()
		}
	}
}
