// Re-implementation of Claude Code's Dynamic System Prompt Templating

export class SystemPromptBuilder {
  private basePrompt: string = "You are TormentNexus, a highly capable AI assistant.";
  private plugins: string[] = [];

  public setBasePrompt(prompt: string): void {
    this.basePrompt = prompt;
  }

  public injectPluginPrompt(prompt: string): void {
    this.plugins.push(prompt);
  }

  public build(): string {
    let finalPrompt = this.basePrompt;
    if (this.plugins.length > 0) {
      finalPrompt += "\n\nAdditional Context / Plugin Instructions:\n";
      for (const plugin of this.plugins) {
        finalPrompt += `- ${plugin}\n`;
      }
    }
    return finalPrompt;
  }
}
