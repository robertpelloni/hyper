package session

import (
	"fmt"
	"io"
	"net"
	"os"
	"sync"
	"time"

	"golang.org/x/crypto/ssh"
)

// SSHConfig defines configuration for connecting to a remote SSH server
type SSHConfig struct {
	Host           string        `json:"host"`
	Port           int           `json:"port"`
	User           string        `json:"user"`
	Password       string        `json:"password,omitempty"`
	PrivateKeyPath string        `json:"private_key_path,omitempty"`
	Timeout        time.Duration `json:"timeout,omitempty"`
}

// Validate checks whether the SSH configuration is valid
func (c *SSHConfig) Validate() error {
	if c.Host == "" {
		return fmt.Errorf("host cannot be empty")
	}
	if c.Port <= 0 || c.Port > 65535 {
		c.Port = 22
	}
	if c.User == "" {
		return fmt.Errorf("user cannot be empty")
	}
	if c.Password == "" && c.PrivateKeyPath == "" {
		return fmt.Errorf("either password or private_key_path must be provided")
	}
	if c.Timeout <= 0 {
		c.Timeout = 10 * time.Second
	}
	return nil
}

// RemoteSession manages an interactive or command-based SSH channel
type RemoteSession struct {
	ID         string
	Config     SSHConfig
	Client     *ssh.Client
	Session    *ssh.Session
	Stdin      io.WriteCloser
	Stdout     io.Reader
	mu         sync.Mutex
	closed     bool
	outputBuf  []string
	maxHistory int
}

// NewRemoteSession establishes an SSH connection and returns a managed RemoteSession
func NewRemoteSession(id string, config SSHConfig) (*RemoteSession, error) {
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid ssh config: %w", err)
	}

	authMethods := make([]ssh.AuthMethod, 0)
	if config.Password != "" {
		authMethods = append(authMethods, ssh.Password(config.Password))
	}
	if config.PrivateKeyPath != "" {
		keyBytes, err := os.ReadFile(config.PrivateKeyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read private key: %w", err)
		}
		signer, err := ssh.ParsePrivateKey(keyBytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %w", err)
		}
		authMethods = append(authMethods, ssh.PublicKeys(signer))
	}

	sshConfig := &ssh.ClientConfig{
		User:            config.User,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         config.Timeout,
	}

	addr := fmt.Sprintf("%s:%d", config.Host, config.Port)
	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		return nil, fmt.Errorf("ssh dial failed: %w", err)
	}

	sess, err := client.NewSession()
	if err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("failed to create ssh session: %w", err)
	}

	modes := ssh.TerminalModes{
		ssh.ECHO:          1,
		ssh.TTY_OP_ISPEED: 14400,
		ssh.TTY_OP_OSPEED: 14400,
	}
	if err := sess.RequestPty("xterm-256color", 24, 80, modes); err != nil {
		_ = sess.Close()
		_ = client.Close()
		return nil, fmt.Errorf("request pty failed: %w", err)
	}

	stdin, err := sess.StdinPipe()
	if err != nil {
		_ = sess.Close()
		_ = client.Close()
		return nil, fmt.Errorf("stdin pipe failed: %w", err)
	}

	stdout, err := sess.StdoutPipe()
	if err != nil {
		_ = sess.Close()
		_ = client.Close()
		return nil, fmt.Errorf("stdout pipe failed: %w", err)
	}

	if err := sess.Shell(); err != nil {
		_ = sess.Close()
		_ = client.Close()
		return nil, fmt.Errorf("start shell failed: %w", err)
	}

	return &RemoteSession{
		ID:         id,
		Config:     config,
		Client:     client,
		Session:    sess,
		Stdin:      stdin,
		Stdout:     stdout,
		outputBuf:  make([]string, 0, 500),
		maxHistory: 500,
	}, nil
}

// AppendOutput records lines in memory buffer
func (rs *RemoteSession) AppendOutput(text string) {
	rs.mu.Lock()
	defer rs.mu.Unlock()
	rs.outputBuf = append(rs.outputBuf, text)
	if len(rs.outputBuf) > rs.maxHistory {
		rs.outputBuf = rs.outputBuf[len(rs.outputBuf)-rs.maxHistory:]
	}
}

// GetOutputTail returns output lines
func (rs *RemoteSession) GetOutputTail(maxLines int) string {
	rs.mu.Lock()
	defer rs.mu.Unlock()
	if len(rs.outputBuf) == 0 {
		return ""
	}
	start := 0
	if maxLines > 0 && len(rs.outputBuf) > maxLines {
		start = len(rs.outputBuf) - maxLines
	}
	var res string
	for i := start; i < len(rs.outputBuf); i++ {
		if i > start {
			res += "\n"
		}
		res += rs.outputBuf[i]
	}
	return res
}

// Write sends data to remote SSH session
func (rs *RemoteSession) Write(p []byte) (int, error) {
	rs.mu.Lock()
	defer rs.mu.Unlock()
	if rs.closed {
		return 0, fmt.Errorf("remote session closed")
	}
	return rs.Stdin.Write(p)
}

// Close terminates the remote SSH session
func (rs *RemoteSession) Close() error {
	rs.mu.Lock()
	defer rs.mu.Unlock()
	if rs.closed {
		return nil
	}
	rs.closed = true
	_ = rs.Stdin.Close()
	_ = rs.Session.Close()
	_ = rs.Client.Close()
	return nil
}

// CheckHostReachability quickly checks whether the SSH target port is open
func CheckHostReachability(host string, port int, timeout time.Duration) bool {
	if port <= 0 {
		port = 22
	}
	if timeout <= 0 {
		timeout = 2 * time.Second
	}
	conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:%d", host, port), timeout)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}
