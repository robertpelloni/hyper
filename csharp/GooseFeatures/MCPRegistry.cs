// Re-implementation of Goose's Model Context Protocol (MCP) Registry

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TormentNexus.GooseFeatures
{
    public class MCPTool
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string InputSchema { get; set; }
        public Func<string, Task<string>> Execute { get; set; }
    }

    public class MCPRegistry
    {
        private readonly Dictionary<string, MCPTool> tools = new Dictionary<string, MCPTool>();

        public void RegisterTool(MCPTool tool)
        {
            tools[tool.Name] = tool;
        }

        public MCPTool GetTool(string name)
        {
            tools.TryGetValue(name, out var tool);
            return tool;
        }

        public async Task<string> ExecuteTool(string name, string input)
        {
            if (tools.TryGetValue(name, out var tool))
            {
                return await tool.Execute(input);
            }
            throw new Exception($"Tool {name} not found in MCP registry.");
        }
    }
}
