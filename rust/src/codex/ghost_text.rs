pub struct GhostTextManager;

impl GhostTextManager {
    pub fn new() -> Self {
        GhostTextManager
    }

    pub fn suggest(&self, input: &str, _cursor_position: usize) -> String {
        if input.starts_with("git c") {
            return "ommit -m "update"".to_string();
        }
        if input.starts_with("cargo r") {
            return "un".to_string();
        }
        String::new()
    }

    pub fn render(&self, input: &str, suggestion: &str) -> String {
        format!("{}[90m{}[0m", input, suggestion)
    }
}