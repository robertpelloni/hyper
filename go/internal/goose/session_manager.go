package goose

// Re-implementation of Goose's Session and Memory Management

type Session struct {
	ID      string
	History []Message
}

func NewSession(id string) *Session {
	return &Session{
		ID:      id,
		History: []Message{},
	}
}

func (s *Session) AddMessage(msg Message) {
	s.History = append(s.History, msg)
}

func (s *Session) GetHistory() []Message {
	return s.History
}

type SessionManager struct {
	sessions map[string]*Session
}

func NewSessionManager() *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
	}
}

func (sm *SessionManager) CreateSession(id string) *Session {
	session := NewSession(id)
	sm.sessions[id] = session
	return session
}

func (sm *SessionManager) GetSession(id string) (*Session, bool) {
	session, exists := sm.sessions[id]
	return session, exists
}

func (sm *SessionManager) ClearSession(id string) {
	delete(sm.sessions, id)
}
