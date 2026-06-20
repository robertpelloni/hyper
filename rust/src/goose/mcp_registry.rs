// Re-implementation of Goose's Model Context Protocol (MCP) Registry

use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;

pub struct MCPTool {
    pub name: String,
    pub description: String,
    pub input_schema: String, // Simplified schema representation
    pub execute: Box<dyn Fn(String) -> Pin<Box<dyn Future<Output = Result<String, String>> + Send>> + Send + Sync>,
}

pub struct MCPRegistry {
    tools: HashMap<String, MCPTool>,
}

impl MCPRegistry {
    pub fn new() -> Self {
        Self {
            tools: HashMap::new(),
        }
    }

    pub fn register_tool(&mut self, tool: MCPTool) {
        self.tools.insert(tool.name.clone(), tool);
    }

    pub fn get_tool(&self, name: &str) -> Option<&MCPTool> {
        self.tools.get(name)
    }

    pub async fn execute_tool(&self, name: &str, input: String) -> Result<String, String> {
        if let Some(tool) = self.tools.get(name) {
            (tool.execute)(input).await
        } else {
            Err(format!("Tool {} not found in MCP registry.", name))
        }
    }
}
