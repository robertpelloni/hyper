// Re-implementation of Goose's Model Context Protocol (MCP) Registry

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  execute: (input: any) => Promise<string>;
}

export class MCPRegistry {
  private tools: Map<string, MCPTool> = new Map();

  public registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  public async executeTool(name: string, input: any): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found in MCP registry.`);
    }
    return await tool.execute(input);
  }
}
