// Re-implementation of Claude Code's Dynamic System Prompt Templating

using System.Collections.Generic;
using System.Text;

namespace TormentNexus.ClaudeCodeFeatures
{
    public class SystemPromptBuilder
    {
        private string _basePrompt = "You are TormentNexus, a highly capable AI assistant.";
        private readonly List<string> _plugins = new List<string>();

        public void SetBasePrompt(string prompt)
        {
            _basePrompt = prompt;
        }

        public void InjectPluginPrompt(string prompt)
        {
            _plugins.Add(prompt);
        }

        public string Build()
        {
            var builder = new StringBuilder(_basePrompt);
            if (_plugins.Count > 0)
            {
                builder.AppendLine("\n\nAdditional Context / Plugin Instructions:");
                foreach (var plugin in _plugins)
                {
                    builder.AppendLine($"- {plugin}");
                }
            }
            return builder.ToString().TrimEnd();
        }
    }
}
