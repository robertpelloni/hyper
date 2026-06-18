use std::collections::HashSet;

pub struct Agent {
    state: String,
    listeners: HashSet<String>,
    steering_queue: Vec<String>,
    follow_up_queue: Vec<String>,
}

impl Agent {
    pub fn new() -> Self {
        Agent {
            state: String::new(),
            listeners: HashSet::new(),
            steering_queue: Vec::new(),
            follow_up_queue: Vec::new(),
        }
    }

    pub fn add_listener(&mut self, listener: String) {
        self.listeners.insert(listener);
    }

    pub fn remove_listener(&mut self, listener: &String) {
        self.listeners.remove(listener);
    }
}