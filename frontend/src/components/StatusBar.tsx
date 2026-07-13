import React from 'react';

import type {SessionInfo} from '../types';

interface StatusBarProps {
  sessions: SessionInfo[];
  agentStatus: string;
}

export default function StatusBar({sessions, agentStatus}: StatusBarProps) {
  return (
    <div className="tn_status_bar">
      <div className="tn_status_item">
        <div className={`tn_status_indicator ${agentStatus === 'running' ? 'active' : ''}`} />
        <span>Agent: {agentStatus}</span>
      </div>
      <div className="tn_status_item">
        <span>Sessions: {sessions.length}</span>
      </div>
      <div className="tn_status_item" style={{marginLeft: 'auto'}}>
        <span>TormentNexus v1.0.0</span>
      </div>
    </div>
  );
}
