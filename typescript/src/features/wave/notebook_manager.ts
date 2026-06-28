export interface NotebookCell {
  id: string;
  type: 'markdown' | 'code' | 'terminal';
  content: string;
  output?: string;
  createdAt: number;
}

export interface Notebook {
  id: string;
  title: string;
  cells: NotebookCell[];
}

export class WaveNotebookManager {
  private notebooks: Map<string, Notebook> = new Map();

  createNotebook(title: string): Notebook {
    const notebook: Notebook = {
      id: crypto.randomUUID(),
      title,
      cells: []
    };
    this.notebooks.set(notebook.id, notebook);
    return notebook;
  }

  addCell(notebookId: string, type: NotebookCell['type'], content: string): NotebookCell | null {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) return null;

    const cell: NotebookCell = {
      id: crypto.randomUUID(),
      type,
      content,
      createdAt: Date.now()
    };
    notebook.cells.push(cell);
    return cell;
  }

  getNotebook(notebookId: string): Notebook | undefined {
    return this.notebooks.get(notebookId);
  }
}
