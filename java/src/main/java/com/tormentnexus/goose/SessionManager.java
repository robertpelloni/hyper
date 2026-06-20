package com.tormentnexus.goose;

// Re-implementation of Goose's Session and Memory Management

import com.tormentnexus.goose.ProviderInterface.Message;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SessionManager {

    public static class Session {
        public String id;
        public List<Message> history;

        public Session(String id) {
            this.id = id;
            this.history = new ArrayList<>();
        }

        public void addMessage(Message message) {
            this.history.add(message);
        }

        public List<Message> getHistory() {
            return this.history;
        }
    }

    private final Map<String, Session> sessions = new HashMap<>();

    public Session createSession(String id) {
        Session session = new Session(id);
        sessions.put(id, session);
        return session;
    }

    public Session getSession(String id) {
        return sessions.get(id);
    }

    public void clearSession(String id) {
        sessions.remove(id);
    }
}
