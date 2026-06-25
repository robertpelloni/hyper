use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct CommandBlock {
    pub id: String,
    pub command: String,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub start_time: u64,
    pub end_time: u64,
    pub cwd: String,
}

pub struct BlockManager {
    blocks: Vec<CommandBlock>,
}

impl BlockManager {
    pub fn new() -> Self {
        BlockManager { blocks: Vec::new() }
    }

    pub fn create_block(&mut self, command: &str, cwd: &str) -> String {
        let id = Uuid::new_v4().to_string();
        let start_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;

        let block = CommandBlock {
            id: id.clone(),
            command: command.to_string(),
            stdout: String::new(),
            stderr: String::new(),
            exit_code: -1,
            start_time,
            end_time: 0,
            cwd: cwd.to_string(),
        };

        self.blocks.push(block);
        id
    }

    pub fn finish_block(&mut self, id: &str, stdout: &str, stderr: &str, exit_code: i32) {
        if let Some(block) = self.blocks.iter_mut().find(|b| b.id == id) {
            block.stdout = stdout.to_string();
            block.stderr = stderr.to_string();
            block.exit_code = exit_code;
            block.end_time = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64;
        }
    }

    pub fn get_blocks(&self) -> &Vec<CommandBlock> {
        &self.blocks
    }
}