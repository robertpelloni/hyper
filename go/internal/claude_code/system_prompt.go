package claude_code

// Re-implementation of Claude Code's Dynamic System Prompt Templating

import "strings"

type SystemPromptBuilder struct {
	basePrompt string
	plugins    []string
}

func NewSystemPromptBuilder() *SystemPromptBuilder {
	return &SystemPromptBuilder{
		basePrompt: "You are TormentNexus, a highly capable AI assistant.",
		plugins:    []string{},
	}
}

func (b *SystemPromptBuilder) SetBasePrompt(prompt string) {
	b.basePrompt = prompt
}

func (b *SystemPromptBuilder) InjectPluginPrompt(prompt string) {
	b.plugins = append(b.plugins, prompt)
}

func (b *SystemPromptBuilder) Build() string {
	finalPrompt := b.basePrompt
	if len(b.plugins) > 0 {
		finalPrompt += "\n\nAdditional Context / Plugin Instructions:\n"
		for _, plugin := range b.plugins {
			finalPrompt += "- " + plugin + "\n"
		}
	}
	return strings.TrimSpace(finalPrompt)
}
