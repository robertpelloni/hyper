package session

import (
	"golang.org/x/crypto/ssh"
)

type RemoteSession struct {
	client *ssh.Client
}

func NewRemoteSession(addr, user, password string) (*RemoteSession, error) {
	config := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{
			ssh.Password(password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	client, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return nil, err
	}
	return &RemoteSession{client: client}, nil
}

func (s *RemoteSession) Close() error {
	return s.client.Close()
}
