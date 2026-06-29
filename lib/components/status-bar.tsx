import React, {useState, useEffect} from 'react';
import {TormentRPC, rpcInstance} from '../rpc';

export const StatusBar = () => {
  const [aiStatus, setAiStatus] = useState('Idle');
  const [toolsActive, setToolsActive] = useState(0);

  useEffect(() => {
    // In a full implementation, this would listen to an RPC event
    // rpcInstance.on('ai-status', setAiStatus);
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 10px',
      backgroundColor: '#222',
      color: '#aaa',
      fontSize: '11px',
      borderTop: '1px solid #333'
    }}>
      <div>Agent Status: <span style={{color: aiStatus === 'Idle' ? '#888' : '#0f0'}}>{aiStatus}</span></div>
      <div>Active Tools: {toolsActive}</div>
    </div>
  );
};
