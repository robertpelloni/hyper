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

func TestManagerLifecycle(t *testing.T) {
	sh, err := exec.LookPath("sh")
	if err != nil {
		t.Skip("sh not available on system")
	}

	mgr := NewManager()
	if mgr.Count() != 0 {
		t.Errorf("expected 0 sessions initially, got %d", mgr.Count())
	}

	s1, err := NewSession("sess-1", sh, []string{}, "", 24, 80)
	if err != nil {
		t.Fatalf("failed to create session 1: %v", err)
	}
	s2, err := NewSession("sess-2", sh, []string{}, "", 24, 80)
	if err != nil {
		t.Fatalf("failed to create session 2: %v", err)
	}

	mgr.AddSession(s1)
	mgr.AddSession(s2)

	if mgr.Count() != 2 {
		t.Errorf("expected 2 sessions, got %d", mgr.Count())
	}

	list := mgr.ListSessions()
	if len(list) != 2 {
		t.Errorf("expected 2 session IDs in list, got %d", len(list))
	}

	retrieved := mgr.GetSession("sess-1")
	if retrieved == nil || retrieved.ID != "sess-1" {
		t.Errorf("expected to retrieve sess-1, got %v", retrieved)
	}

	mgr.RemoveSession("sess-1")
	_ = s1.Close()
	if mgr.Count() != 1 {
		t.Errorf("expected 1 session after removal, got %d", mgr.Count())
	}

	mgr.CloseAll()
	if mgr.Count() != 0 {
		t.Errorf("expected 0 sessions after CloseAll, got %d", mgr.Count())
	}
}

func TestSessionOutputTail(t *testing.T) {
	sh, err := exec.LookPath("sh")
	if err != nil {
		t.Skip("sh not available on system")
	}

	mgr := NewManager()
	s, err := NewSession("test-out", sh, []string{}, "", 24, 80)
	if err != nil {
		t.Fatalf("failed to create session: %v", err)
	}
	defer func() {
		_ = s.Close()
	}()

	s.AppendOutput("line 1: start")
	s.AppendOutput("line 2: executing command")
	s.AppendOutput("line 3: done")

	tail := s.GetOutputTail(2)
	expected := "line 2: executing command\nline 3: done"
	if tail != expected {
		t.Errorf("expected tail %q, got %q", expected, tail)
	}

	mgr.AddSession(s)
	mgrTail := mgr.GetSessionOutput("test-out", 1)
	if mgrTail != "line 3: done" {
		t.Errorf("expected %q, got %q", "line 3: done", mgrTail)
	}
}

func TestSessionSnapshotExportAndPersistence(t *testing.T) {
	sh, err := exec.LookPath("sh")
	if err != nil {
		t.Skip("sh not available on system")
	}

	mgr := NewManager()
	s1, err := NewSession("sess-snap-1", sh, []string{"-l"}, "/tmp", 24, 80)
	if err != nil {
		t.Fatalf("failed to create session: %v", err)
	}
	defer func() {
		_ = s1.Close()
	}()

	s1.AppendOutput("cmd: ls -la")
	s1.AppendOutput("output: file1.txt file2.txt")
	mgr.AddSession(s1)

	snap := mgr.ExportSnapshot()
	if snap.Version != "1.1.0" {
		t.Errorf("expected version 1.1.0, got %s", snap.Version)
	}
	if len(snap.Sessions) != 1 {
		t.Fatalf("expected 1 session in snapshot, got %d", len(snap.Sessions))
	}
	if snap.Sessions[0].ID != "sess-snap-1" || len(snap.Sessions[0].OutputBuf) != 2 {
		t.Errorf("unexpected snapshot session contents: %+v", snap.Sessions[0])
	}

	// Test disk persistence
	tmpPath := "/tmp/test_tormentnexus_session_snapshot.json"
	if err := mgr.SaveSnapshotToFile(tmpPath); err != nil {
		t.Fatalf("failed to save snapshot: %v", err)
	}

	loaded, err := LoadSnapshotFromFile(tmpPath)
	if err != nil {
		t.Fatalf("failed to load snapshot from file: %v", err)
	}
	if loaded.Version != snap.Version || len(loaded.Sessions) != 1 {
		t.Errorf("loaded snapshot mismatch: %+v", loaded)
	}
	if loaded.Sessions[0].OutputBuf[1] != "output: file1.txt file2.txt" {
		t.Errorf("loaded buffer mismatch: %v", loaded.Sessions[0].OutputBuf)
	}
}
