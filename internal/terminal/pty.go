package terminal

import (
	"os"
	"os/exec"

	"github.com/creack/pty"
)

type Session struct {
	pty *os.File
	cmd *exec.Cmd
}

func NewSession(command string, args []string) (*Session, error) {
	c := exec.Command(command, args...)
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
	if s.pty != nil {
		s.pty.Close()
	}
	if s.cmd != nil && s.cmd.Process != nil {
		s.cmd.Process.Kill()
	}
	return nil
}
