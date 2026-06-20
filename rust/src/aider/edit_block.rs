// Re-implementation of Aider's SEARCH/REPLACE diff format patch application

use regex::Regex;

pub struct EditBlock {
    pub search: String,
    pub replace: String,
}

pub fn parse_edit_blocks(llm_response: &str) -> Vec<EditBlock> {
    let mut blocks = Vec::new();
    let re = Regex::new(r"<<<<<<< SEARCH\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> REPLACE").unwrap();

    for cap in re.captures_iter(llm_response) {
        blocks.push(EditBlock {
            search: cap[1].to_string(),
            replace: cap[2].to_string(),
        });
    }
    blocks
}

pub fn apply_edit_blocks(file_content: &str, blocks: &[EditBlock]) -> String {
    let mut new_content = file_content.to_string();
    for block in blocks {
        if new_content.contains(&block.search) {
            new_content = new_content.replace(&block.search, &block.replace);
        } else {
            println!("Warning: Could not find SEARCH block exactly.");
        }
    }
    new_content
}
