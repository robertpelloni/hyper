import {ipcRenderer} from 'electron';

export class TormentRPC {
  static async createCommandBlock(command: string, cwd: string): Promise<any> {
    return await ipcRenderer.invoke('rpc-create-command-block', {command, cwd});
  }

  static async getGhostSuggestion(input: string): Promise<string> {
    return await ipcRenderer.invoke('rpc-get-ghost-suggestion', {input});
  }
}

  static async getNotebook(notebookId: string): Promise<any> {
    return await ipcRenderer.invoke('rpc-get-notebook', notebookId);
  }

  static async addNotebookCell(notebookId: string, type: string, content: string): Promise<any> {
    return await ipcRenderer.invoke('rpc-add-notebook-cell', {notebookId, type, content});
  }
