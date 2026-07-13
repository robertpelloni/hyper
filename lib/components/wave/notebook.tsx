import React, {useState, useEffect} from 'react';
import {TormentRPC} from '../../rpc';

export const NotebookCell = ({cell}: {cell: any}) => {
  return (
    <div style={{border: '1px solid #444', margin: '15px 0', borderRadius: '6px', overflow: 'hidden'}}>
      <div
        style={{
          fontSize: '11px',
          color: '#aaa',
          backgroundColor: '#2a2a2a',
          padding: '4px 10px',
          borderBottom: '1px solid #444',
          display: 'flex',
          justifyContent: 'space-between'
        }}
        title={`Cell ID: ${cell.id}`}
      >
        <span>{cell.type.toUpperCase()} CELL</span>
        <span>{new Date(cell.createdAt).toLocaleTimeString()}</span>
      </div>

      <div style={{padding: '10px'}}>
        {cell.type === 'markdown' ? (
          <div
            style={{color: '#eee', lineHeight: '1.5'}}
            title="Markdown documentation cell"
          >
            {cell.content}
          </div>
        ) : (
          <pre
            style={{color: '#4af', backgroundColor: '#0f0f0f', padding: '10px', borderRadius: '4px', margin: 0}}
            title="Executable code cell"
          >
            {cell.content}
          </pre>
        )}

        {cell.output && (
          <div style={{marginTop: '10px', borderTop: '1px dashed #333', paddingTop: '10px'}}>
            <div style={{fontSize: '10px', color: '#888', marginBottom: '4px'}}>OUTPUT:</div>
            <pre
              style={{color: '#ccc', backgroundColor: '#1a1a1a', padding: '8px', margin: 0, borderRadius: '4px'}}
              title="Execution output from the kernel"
            >
              {cell.output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export const NotebookView = ({notebookId}: {notebookId: string}) => {
  const [notebook, setNotebook] = useState<any>(null);

  useEffect(() => {
    TormentRPC.getNotebook(notebookId).then(setNotebook);
  }, [notebookId]);

  if (!notebook) return <div style={{padding: '20px', color: '#888'}}>Loading notebook kernel...</div>;

  return (
    <div style={{padding: '20px 40px', color: '#fff', backgroundColor: '#1e1e1e', height: '100%', overflowY: 'auto'}}>
      <h2 style={{borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px'}}>
        {notebook.title}
      </h2>

      <div className="notebook-cells">
        {notebook.cells.map((cell: any) => (
          <NotebookCell key={cell.id} cell={cell} />
        ))}
      </div>

      <div style={{marginTop: '30px', display: 'flex', gap: '10px'}}>
        <button
          title="Add a new text documentation cell"
          style={{padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          onClick={() => TormentRPC.addNotebookCell(notebookId, 'markdown', 'New markdown cell')}
        >
          + Add Markdown
        </button>
        <button
          title="Add a new executable code cell"
          style={{padding: '8px 16px', background: '#2a4a3a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          onClick={() => TormentRPC.addNotebookCell(notebookId, 'code', 'echo "Hello World"')}
        >
          + Add Code
        </button>
      </div>
    </div>
  );
};
