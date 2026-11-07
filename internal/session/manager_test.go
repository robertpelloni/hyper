package session

import (
	"os/exec"
	"testing"
)

func TestNewSessionAndWrite(t *testing.T) {
	sh, err := exec.LookPath("sh")
	if err != nil {
		t.Skip("sh not available on system")
	}

	sess, err := NewSession("test-sess-1", sh, []string{}, "", 24, 80)
	if err != nil {
		t.Fatalf("failed to create session: %v", err)
	}
	defer func() {
		_ = sess.Close()
	}()

	n, err := sess.Write([]byte("echo hello\n"))
	if err != nil {
		t.Fatalf("failed to write to session PTY: %v", err)
	}
	if n == 0 {
		t.Error("expected non-zero bytes written")
	}

	err = sess.Resize(30, 100)
	if err != nil {
		t.Fatalf("failed to resize session: %v", err)
	}
}
