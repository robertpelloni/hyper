// Re-implementation of Claude Code's Slash Command Router

export type CommandHandler = (args: string[]) => Promise<string>;

export class SlashCommandRouter {
  private commands: Map<string, CommandHandler> = new Map();

  public registerCommand(command: string, handler: CommandHandler): void {
    if (!command.startsWith('/')) {
      throw new Error("Slash commands must start with '/'");
    }
    this.commands.set(command, handler);
  }

  public isSlashCommand(input: string): boolean {
    return input.trim().startsWith('/');
  }

  public async executeCommand(input: string): Promise<string> {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    const handler = this.commands.get(cmd);
    if (!handler) {
      return `Unknown command: ${cmd}. Type /help for available commands.`;
    }

    return await handler(args);
  }
}
