package session

import (
	"strings"
	"testing"
	"time"
)

func TestSSHConfigValidation(t *testing.T) {
	tests := []struct {
		name    string
		config  SSHConfig
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid config with password",
			config: SSHConfig{
				Host:     "127.0.0.1",
				Port:     22,
				User:     "root",
				Password: "password123",
			},
			wantErr: false,
		},
		{
			name: "missing host",
			config: SSHConfig{
				Port:     22,
				User:     "root",
				Password: "password123",
			},
			wantErr: true,
			errMsg:  "host cannot be empty",
		},
		{
			name: "missing user",
			config: SSHConfig{
				Host:     "127.0.0.1",
				Port:     22,
				Password: "password123",
			},
			wantErr: true,
			errMsg:  "user cannot be empty",
		},
		{
			name: "missing authentication credentials",
			config: SSHConfig{
				Host: "127.0.0.1",
				Port: 22,
				User: "root",
			},
			wantErr: true,
			errMsg:  "either password or private_key_path must be provided",
		},
		{
			name: "default port and timeout assignment",
			config: SSHConfig{
				Host:     "127.0.0.1",
				User:     "root",
				Password: "password123",
			},
			wantErr: false,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.config.Validate()
			if tc.wantErr {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				if !strings.Contains(err.Error(), tc.errMsg) {
					t.Errorf("expected error %q, got %q", tc.errMsg, err.Error())
				}
			} else {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if tc.config.Port != 22 {
					t.Errorf("expected default port 22, got %d", tc.config.Port)
				}
				if tc.config.Timeout <= 0 {
					t.Errorf("expected positive default timeout, got %v", tc.config.Timeout)
				}
			}
		})
	}
}

func TestRemoteSessionLifecycleInManager(t *testing.T) {
	mgr := NewManager()

	rs := &RemoteSession{
		ID: "remote-sess-1",
		Config: SSHConfig{
			Host: "192.168.1.100",
			Port: 22,
			User: "ubuntu",
		},
		outputBuf:  make([]string, 0),
		maxHistory: 50,
	}

	mgr.AddRemoteSession(rs)

	if count := mgr.Count(); count != 1 {
		t.Fatalf("expected count 1, got %d", count)
	}

	retrieved := mgr.GetRemoteSession("remote-sess-1")
	if retrieved == nil {
		t.Fatalf("expected to retrieve remote session, got nil")
	}

	rs.AppendOutput("connected to remote host")
	rs.AppendOutput("system load: 0.15")

	tail := mgr.GetSessionOutput("remote-sess-1", 5)
	if !strings.Contains(tail, "system load: 0.15") {
		t.Errorf("expected tail output to contain load info, got %q", tail)
	}

	mgr.RemoveSession("remote-sess-1")
	if count := mgr.Count(); count != 0 {
		t.Fatalf("expected count 0 after removal, got %d", count)
	}
}

func TestCheckHostReachability(t *testing.T) {
	// 127.0.0.1:54321 is not expected to be listening, should return false promptly
	reachable := CheckHostReachability("127.0.0.1", 54321, 50*time.Millisecond)
	if reachable {
		t.Errorf("expected 127.0.0.1:54321 to be unreachable")
	}
}
