import React, { useState } from 'react';

export const WarpBlock = ({command, stdout, stderr}: {command: string; stdout: string; stderr: string}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="warp-block"
      style={{
        border: '1px solid #333',
        margin: '10px 0',
        borderRadius: '6px',
        backgroundColor: '#111',
        overflow: 'hidden'
      }}
    >
      <div
        className="warp-header"
        onClick={() => setCollapsed(!collapsed)}
        title="Click to collapse/expand this command execution block"
        style={{
          padding: '8px 12px',
          backgroundColor: '#222',
          borderBottom: collapsed ? 'none' : '1px solid #333',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{fontWeight: 'bold', color: '#00FF00', fontFamily: 'monospace'}}>
          <span style={{color: '#888', marginRight: '8px'}}>$</span>
          {command || 'Running...'}
        </div>
        <div style={{fontSize: '0.8em', color: '#888'}}>
          {collapsed ? '▶ Expand' : '▼ Collapse'}
        </div>
      </div>

      {!collapsed && (
        <div className="warp-body" style={{padding: '10px'}}>
          {stdout && (
            <pre
              className="warp-stdout"
              title="Standard Output"
              style={{
                color: '#DDD',
                margin: 0,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
            >
              {stdout}
            </pre>
          )}
          {stderr && (
            <pre
              className="warp-stderr"
              title="Standard Error"
              style={{
                color: '#FF5555',
                margin: stdout ? '10px 0 0 0' : 0,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                borderLeft: '3px solid #FF5555',
                paddingLeft: '10px'
              }}
            >
              {stderr}
            </pre>
          )}
          {!stdout && !stderr && (
            <div style={{color: '#555', fontStyle: 'italic', fontSize: '0.9em'}}>
              No output
            </div>
          )}
        </div>
      )}
    </div>
  );
};
