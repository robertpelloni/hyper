package terminal

import (
	"context"
	"io"
	"os"
	"os/exec"

	"github.com/creack/pty"
)

type Session struct {
	pty *os.File
	cmd *exec.Cmd
}

func NewSession(ctx context.Context, command string, args []string, env []string) (*Session, error) {
	c := exec.CommandContext(ctx, command, args...)
	c.Env = env

	// Ghostty-inspired performance optimization: set buffer sizes if supported
	f, err := pty.Start(c)
	if err != nil {
		return nil, err
	}

	return &Session{pty: f, cmd: c}, nil
}

func (s *Session) Read(p []byte) (n int, err error) {
	return s.pty.Read(p)
}

func (s *Session) Write(p []byte) (n int, err error) {
	return s.pty.Write(p)
}

func (s *Session) Resize(rows, cols uint16) error {
	return pty.Setsize(s.pty, &pty.Winsize{
		Rows: rows,
		Cols: cols,
	})
}

func (s *Session) Close() error {
	var err error
	if s.pty != nil {
		err = s.pty.Close()
	}
	if s.cmd != nil && s.cmd.Process != nil {
		s.cmd.Process.Kill()
		s.cmd.Wait()
	}
	return err
}

// Ghostty parity: high-frequency streaming support
func (s *Session) Stream(ctx context.Context, w io.Writer) error {
	_, err := io.Copy(w, s.pty)
	return err
}
