import React, {useState, useEffect} from 'react';

import {GhostTextInput} from './components/ghost-text-input';
import {WarpBlock} from './components/warp-block';
import {NotebookView} from './components/wave/notebook';
import {TormentRPC, rpcInstance} from './rpc';

export const MainApp = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'terminal' | 'notebook'>('terminal');

  useEffect(() => {
    const onPtyBlock = (block: any) => {
      setBlocks(prev => {
        const lastBlock = prev[prev.length - 1];
        if (lastBlock && lastBlock.id === block.id) {
          return [...prev.slice(0, -1), {...lastBlock, stdout: lastBlock.stdout + atob(block.data)}];
        }
        return [...prev, {id: block.id, command: 'external', stdout: atob(block.data), stderr: ''}];
      });
    };
    rpcInstance.on('pty-block', onPtyBlock);
    return () => { rpcInstance.off('pty-block', onPtyBlock); };
  }, []);

  const executeCommand = async (cmd: string) => {
    const block = await TormentRPC.createCommandBlock(cmd, '/');
    setBlocks([...blocks, block]);
  };

  return (
    <div style={{backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column'}}>
      <div style={{display: 'flex', borderBottom: '1px solid #333', padding: '10px'}}>
        <button
          style={{marginRight: '10px', background: activeTab === 'terminal' ? '#333' : '#111', color: '#fff'}}
          onClick={() => setActiveTab('terminal')}
        >
          Terminal
        </button>
        <button
          style={{background: activeTab === 'notebook' ? '#333' : '#111', color: '#fff'}}
          onClick={() => setActiveTab('notebook')}
        >
          Wave Notebook
        </button>
      </div>

      {activeTab === 'terminal' ? (
        <div style={{flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
          <div style={{flex: 1, overflowY: 'auto'}}>
            {blocks.map((b, i) => (
              <WarpBlock key={i} command={b.command} stdout={b.stdout} stderr={b.stderr} />
            ))}
          </div>
          <GhostTextInput onExecute={executeCommand} />
        </div>
      ) : (
        <div style={{flex: 1, overflow: 'hidden'}}>
          <NotebookView notebookId="1" />
        </div>
      )}
    </div>
  );
};
