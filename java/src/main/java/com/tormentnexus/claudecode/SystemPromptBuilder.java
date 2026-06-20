package com.tormentnexus.claudecode;

// Re-implementation of Claude Code's Dynamic System Prompt Templating

import java.util.ArrayList;
import java.util.List;

public class SystemPromptBuilder {

    private String basePrompt = "You are TormentNexus, a highly capable AI assistant.";
    private final List<String> plugins = new ArrayList<>();

    public void setBasePrompt(String prompt) {
        this.basePrompt = prompt;
    }

    public void injectPluginPrompt(String prompt) {
        this.plugins.add(prompt);
    }

    public String build() {
        StringBuilder builder = new StringBuilder(this.basePrompt);
        if (!plugins.isEmpty()) {
            builder.append("\n\nAdditional Context / Plugin Instructions:\n");
            for (String plugin : plugins) {
                builder.append("- ").append(plugin).append("\n");
            }
        }
        return builder.toString().trim();
    }
}
