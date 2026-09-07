use std::fs;
use std::path::Path;

pub struct MultiFileContext;

impl MultiFileContext {
    pub fn new() -> Self {
        MultiFileContext
    }

    pub fn gather_context(&self, directory: &str, max_files: usize) -> String {
        let mut context = String::new();
        let mut file_count = 0;

        if let Ok(entries) = fs::read_dir(directory) {
            for entry in entries.flatten() {
                if file_count >= max_files {
                    break;
                }

                let path = entry.path();
                if path.is_file() {
                    if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                        if !file_name.starts_with('.') {
                            if let Ok(content) = fs::read_to_string(&path) {
                                context.push_str(&format!("\n--- File: {} ---\n", file_name));
                                let snippet: String = content.chars().take(1000).collect();
                                context.push_str(&snippet);
                                file_count += 1;
                            }
                        }
                    }
                }
            }
        }
        context
    }
}