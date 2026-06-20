// Re-implementation of Aider's Tree-Sitter RepoMap context generator

use std::fs;
use std::path::Path;

pub struct RepoMap {
    project_root: String,
}

impl RepoMap {
    pub fn new(project_root: &str) -> Self {
        Self {
            project_root: project_root.to_string(),
        }
    }

    pub fn get_map_context(&self) -> String {
        // Scaffold: Real implementation requires tree-sitter bindings.
        let mut file_list = Vec::new();
        let path = Path::new(&self.project_root);
        self.list_files_in_directory(path, &mut file_list);

        format!("Project Root: {}\nFiles:\n{}\n[Map content generated via Tree-Sitter]", self.project_root, file_list.join("\n"))
    }

    fn list_files_in_directory(&self, dir: &Path, file_list: &mut Vec<String>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let path_str = path.to_string_lossy();
                    if !path_str.contains("node_modules") && !path_str.contains(".git") {
                        self.list_files_in_directory(&path, file_list);
                    }
                } else {
                    file_list.push(path.to_string_lossy().into_owned());
                }
            }
        }
    }
}
