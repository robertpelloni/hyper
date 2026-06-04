package session

import (
	"fmt"
	"sync"
	"time"

	"golang.org/x/crypto/ssh"
)

type RemoteManager struct {
	connections map[string]*SSHConnection
	mu          sync.RWMutex
}

type SSHConnection struct {
	ID     string
	Client *ssh.Client
}

func NewRemoteManager() *RemoteManager {
	return &RemoteManager{
		connections: make(map[string]*SSHConnection),
	}
}

func (m *RemoteManager) Connect(id, addr, user, password string) error {
	config := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{
			ssh.Password(password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // Placeholder for now, must be replaced with proper verification
		Timeout:         10 * time.Second,
	}

	client, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return fmt.Errorf("failed to dial: %w", err)
	}

	conn := &SSHConnection{
		ID:     id,
		Client: client,
	}

	m.mu.Lock()
	m.connections[id] = conn
	m.mu.Unlock()

	return nil
}

func (m *RemoteManager) NewSession(id string) (*ssh.Session, error) {
	m.mu.RLock()
	conn, ok := m.connections[id]
	m.mu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("connection not found")
	}

	return conn.Client.NewSession()
}

func (m *RemoteManager) Close(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	conn, ok := m.connections[id]
	if !ok {
		return nil
	}
	delete(m.connections, id)
	return conn.Client.Close()
}
