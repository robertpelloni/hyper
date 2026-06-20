package goose

// Re-implementation of Goose's Abstract LLM Provider Interface

type Role string

const (
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
	RoleSystem    Role = "system"
)

type Message struct {
	Role    Role
	Content string
}

type ProviderResponse struct {
	Text             string
	PromptTokens     int
	CompletionTokens int
}

type LLMProvider interface {
	Name() string
	Chat(messages []Message) (ProviderResponse, error)
	StreamChat(messages []Message, onChunk func(chunk string)) (ProviderResponse, error)
}
