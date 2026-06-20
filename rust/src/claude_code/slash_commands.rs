// Re-implementation of Claude Code's Slash Command Router

use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;

pub type CommandHandler = Box<dyn Fn(Vec<String>) -> Pin<Box<dyn Future<Output = String> + Send>> + Send + Sync>;

pub struct SlashCommandRouter {
    commands: HashMap<String, CommandHandler>,
}

impl SlashCommandRouter {
    pub fn new() -> Self {
        Self {
            commands: HashMap::new(),
        }
    }

    pub fn register_command(&mut self, command: &str, handler: CommandHandler) -> Result<(), String> {
        if !command.starts_with('/') {
            return Err("Slash commands must start with '/'".to_string());
        }
        self.commands.insert(command.to_string(), handler);
        Ok(())
    }

    pub fn is_slash_command(&self, input: &str) -> bool {
        input.trim().starts_with('/')
    }

    pub async fn execute_command(&self, input: &str) -> String {
        let mut parts = input.trim().split_whitespace();
        if let Some(cmd) = parts.next() {
            let args: Vec<String> = parts.map(String::from).collect();
            if let Some(handler) = self.commands.get(cmd) {
                handler(args).await
            } else {
                format!("Unknown command: {}. Type /help for available commands.", cmd)
            }
        } else {
            "Empty command.".to_string()
        }
    }
}
