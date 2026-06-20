// Re-implementation of Claude Code's Slash Command Router

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TormentNexus.ClaudeCodeFeatures
{
    public class SlashCommandRouter
    {
        private readonly Dictionary<string, Func<string[], Task<string>>> _commands = new Dictionary<string, Func<string[], Task<string>>>();

        public void RegisterCommand(string command, Func<string[], Task<string>> handler)
        {
            if (!command.StartsWith("/"))
            {
                throw new ArgumentException("Slash commands must start with '/'");
            }
            _commands[command] = handler;
        }

        public bool IsSlashCommand(string input)
        {
            return input.Trim().StartsWith("/");
        }

        public async Task<string> ExecuteCommand(string input)
        {
            var parts = input.Trim().Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return "Empty command.";

            var cmd = parts[0];
            var args = parts.Skip(1).ToArray();

            if (_commands.TryGetValue(cmd, out var handler))
            {
                return await handler(args);
            }

            return $"Unknown command: {cmd}. Type /help for available commands.";
        }
    }
}
