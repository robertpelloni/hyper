import React from 'react';

export const WarpBlock = ({ command, stdout, stderr }: { command: string, stdout: string, stderr: string }) => {
    return (
        <div className="warp-block" style={{ border: '1px solid #333', margin: '5px', padding: '10px', borderRadius: '4px' }}>
            <div className="warp-input" style={{ fontWeight: 'bold', color: '#00FF00' }}>$ {command}</div>
            {stdout && <pre className="warp-stdout" style={{ color: '#DDD' }}>{stdout}</pre>}
            {stderr && <pre className="warp-stderr" style={{ color: '#FF0000' }}>{stderr}</pre>}
        </div>
    );
};
