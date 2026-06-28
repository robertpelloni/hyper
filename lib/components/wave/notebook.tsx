import React, {useState, useEffect} from 'react';
import {TormentRPC} from '../../rpc';

export const NotebookCell = ({cell}: {cell: any}) => {
  return (
    <div style={{border: '1px solid #444', margin: '10px 0', padding: '10px', borderRadius: '5px'}}>
      <div style={{fontSize: '12px', color: '#888', marginBottom: '5px'}}>
        {cell.type.toUpperCase()} CELL
      </div>
      {cell.type === 'markdown' ? (
        <div style={{color: '#ddd'}}>{cell.content}</div>
      ) : (
        <pre style={{color: '#0f0', backgroundColor: '#111', padding: '5px'}}>{cell.content}</pre>
      )}
      {cell.output && (
        <pre style={{color: '#ccc', backgroundColor: '#222', padding: '5px', marginTop: '5px'}}>
          {cell.output}
        </pre>
      )}
    </div>
  );
};

export const NotebookView = ({notebookId}: {notebookId: string}) => {
  const [notebook, setNotebook] = useState<any>(null);

  useEffect(() => {
    // In a real implementation we would fetch the notebook state
    TormentRPC.getNotebook(notebookId).then(setNotebook);
  }, [notebookId]);

  if (!notebook) return <div>Loading notebook...</div>;

  return (
    <div style={{padding: '20px', color: '#fff', backgroundColor: '#1e1e1e', height: '100vh', overflowY: 'auto'}}>
      <h2>{notebook.title}</h2>
      {notebook.cells.map((cell: any) => (
        <NotebookCell key={cell.id} cell={cell} />
      ))}
      <div style={{marginTop: '20px'}}>
        <button onClick={() => TormentRPC.addNotebookCell(notebookId, 'markdown', 'New markdown cell')}>
          + Markdown
        </button>
        <button onClick={() => TormentRPC.addNotebookCell(notebookId, 'code', 'echo "Hello World"')}>
          + Code
        </button>
      </div>
    </div>
  );
};
