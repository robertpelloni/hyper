// Re-implementation of Goose's Abstract LLM Provider Interface

use async_trait::async_trait;

pub enum Role {
    User,
    Assistant,
    System,
}

pub struct Message {
    pub role: Role,
    pub content: String,
}

pub struct ProviderResponse {
    pub text: String,
    pub prompt_tokens: Option<u32>,
    pub completion_tokens: Option<u32>,
}

#[async_trait]
pub trait LLMProvider {
    fn name(&self) -> &str;
    async fn chat(&self, messages: &[Message]) -> Result<ProviderResponse, String>;
    async fn stream_chat<F>(&self, messages: &[Message], on_chunk: F) -> Result<ProviderResponse, String>
    where
        F: FnMut(&str) + Send + Sync;
}
