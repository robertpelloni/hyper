import {ipcRenderer} from 'electron';
import {EventEmitter} from 'events';

export class TormentRPC extends EventEmitter {
  constructor() {
    super();
    ipcRenderer.on('pty-block', (event, block) => {
      this.emit('pty-block', block);
    });
  }

  static async createCommandBlock(command: string, cwd: string): Promise<any> {
    return await ipcRenderer.invoke('rpc-create-command-block', {command, cwd});
  }

  static async getGhostSuggestion(input: string): Promise<string> {
    return await ipcRenderer.invoke('rpc-get-ghost-suggestion', {input});
  }

  static async getNotebook(notebookId: string): Promise<any> {
    return await ipcRenderer.invoke('rpc-get-notebook', notebookId);
  }

  static async addNotebookCell(notebookId: string, type: string, content: string): Promise<any> {
    return await ipcRenderer.invoke('rpc-add-notebook-cell', {notebookId, type, content});
  }
}

export const rpcInstance = new TormentRPC();
