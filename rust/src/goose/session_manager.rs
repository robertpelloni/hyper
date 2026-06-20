// Re-implementation of Goose's Session and Memory Management

use crate::goose::provider_interface::Message;
use std::collections::HashMap;

pub struct Session {
    pub id: String,
    pub history: Vec<Message>,
}

impl Session {
    pub fn new(id: &str) -> Self {
        Self {
            id: id.to_string(),
            history: Vec::new(),
        }
    }

    pub fn add_message(&mut self, message: Message) {
        self.history.push(message);
    }

    pub fn get_history(&self) -> &[Message] {
        &self.history
    }
}

pub struct SessionManager {
    sessions: HashMap<String, Session>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }

    pub fn create_session(&mut self, id: &str) -> &mut Session {
        let session = Session::new(id);
        self.sessions.insert(id.to_string(), session);
        self.sessions.get_mut(id).unwrap()
    }

    pub fn get_session(&mut self, id: &str) -> Option<&mut Session> {
        self.sessions.get_mut(id)
    }

    pub fn clear_session(&mut self, id: &str) {
        self.sessions.remove(id);
    }
}
