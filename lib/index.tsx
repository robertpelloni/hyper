import React, { useState } from 'react';
import { WarpBlock } from './components/warp-block';
import { GhostTextInput } from './components/ghost-text-input';
import { TormentRPC } from './rpc';

export const MainApp = () => {
    const [blocks, setBlocks] = useState<any[]>([]);

    const executeCommand = async (cmd: string) => {
        const block = await TormentRPC.createCommandBlock(cmd, '/');
        setBlocks([...blocks, block]);
    };

    return (
        <div style={{ backgroundColor: '#000', color: '#fff', height: '100vh', padding: '10px' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {blocks.map((b, i) => <WarpBlock key={i} command={b.command} stdout={b.stdout} stderr={b.stderr} />)}
            </div>
            <GhostTextInput onExecute={executeCommand} />
        </div>
    );
};
