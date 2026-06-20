package com.tormentnexus.goose;

// Re-implementation of Goose's Abstract LLM Provider Interface

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

public interface ProviderInterface {

    enum Role {
        USER, ASSISTANT, SYSTEM
    }

    class Message {
        public Role role;
        public String content;

        public Message(Role role, String content) {
            this.role = role;
            this.content = content;
        }
    }

    class ProviderResponse {
        public String text;
        public Integer promptTokens;
        public Integer completionTokens;

        public ProviderResponse(String text, Integer promptTokens, Integer completionTokens) {
            this.text = text;
            this.promptTokens = promptTokens;
            this.completionTokens = completionTokens;
        }
    }

    interface LLMProvider {
        String getName();
        CompletableFuture<ProviderResponse> chat(List<Message> messages);
        CompletableFuture<ProviderResponse> streamChat(List<Message> messages, Consumer<String> onChunk);
    }
}
