// Re-implementation of Claude Code's Dynamic System Prompt Templating

pub struct SystemPromptBuilder {
    base_prompt: String,
    plugins: Vec<String>,
}

impl SystemPromptBuilder {
    pub fn new() -> Self {
        Self {
            base_prompt: "You are TormentNexus, a highly capable AI assistant.".to_string(),
            plugins: Vec::new(),
        }
    }

    pub fn set_base_prompt(&mut self, prompt: &str) {
        self.base_prompt = prompt.to_string();
    }

    pub fn inject_plugin_prompt(&mut self, prompt: &str) {
        self.plugins.push(prompt.to_string());
    }

    pub fn build(&self) -> String {
        let mut final_prompt = self.base_prompt.clone();
        if !self.plugins.is_empty() {
            final_prompt.push_str("\n\nAdditional Context / Plugin Instructions:\n");
            for plugin in &self.plugins {
                final_prompt.push_str(&format!("- {}\n", plugin));
            }
        }
        final_prompt
    }
}
