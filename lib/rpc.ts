import {ipcRenderer} from 'electron';

export class TormentRPC {
  static async createCommandBlock(command: string, cwd: string): Promise<any> {
    return await ipcRenderer.invoke('rpc-create-command-block', {command, cwd});
  }

  static async getGhostSuggestion(input: string): Promise<string> {
    return await ipcRenderer.invoke('rpc-get-ghost-suggestion', {input});
  }
}
