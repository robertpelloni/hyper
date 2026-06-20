// Re-implementation of Goose's Abstract LLM Provider Interface

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TormentNexus.GooseFeatures
{
    public enum Role
    {
        User,
        Assistant,
        System
    }

    public class Message
    {
        public Role Role { get; set; }
        public string Content { get; set; }
    }

    public class ProviderResponse
    {
        public string Text { get; set; }
        public int? PromptTokens { get; set; }
        public int? CompletionTokens { get; set; }
    }

    public interface ILLMProvider
    {
        string Name { get; }
        Task<ProviderResponse> ChatAsync(List<Message> messages);
        Task<ProviderResponse> StreamChatAsync(List<Message> messages, Action<string> onChunk);
    }
}
