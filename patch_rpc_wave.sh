#!/bin/bash
cat << 'APP_EOF' >> app/rpc.ts

// Wave-like notebook terminal capabilities RPC handles
ipcMain.handle('rpc-get-notebook', async (event, notebookId) => {
  return {
    id: notebookId,
    title: "Wave Notebook " + notebookId,
    cells: [
      { id: "1", type: "markdown", content: "# Welcome to Wave Terminal", createdAt: Date.now() },
      { id: "2", type: "code", content: "echo 'Wave capabilities active'", output: "Wave capabilities active", createdAt: Date.now() }
    ]
  };
});

ipcMain.handle('rpc-add-notebook-cell', async (event, {notebookId, type, content}) => {
  return {
    id: "uuid-" + Date.now(),
    type,
    content,
    createdAt: Date.now()
  };
});
APP_EOF

cat << 'RPC_EOF' >> lib/rpc.ts

  static async getNotebook(notebookId: string): Promise<any> {
    return await ipcRenderer.invoke('rpc-get-notebook', notebookId);
  }

  static async addNotebookCell(notebookId: string, type: string, content: string): Promise<any> {
    return await ipcRenderer.invoke('rpc-add-notebook-cell', {notebookId, type, content});
  }
RPC_EOF
