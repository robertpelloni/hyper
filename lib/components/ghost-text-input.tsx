import React, { useState, useEffect } from 'react';
import { TormentRPC } from '../rpc';

export const GhostTextInput = ({ onExecute }: { onExecute: (cmd: string) => void }) => {
    const [input, setInput] = useState('');
    const [suggestion, setSuggestion] = useState('');

    useEffect(() => {
        if (input.length > 0) {
            TormentRPC.getGhostSuggestion(input).then(setSuggestion);
        } else {
            setSuggestion('');
        }
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab' && suggestion) {
            e.preventDefault();
            setInput(input + suggestion);
        }
        if (e.key === 'Enter') {
            onExecute(input);
            setInput('');
        }
    };

    return (
        <div style={{ display: 'flex', fontFamily: 'monospace' }}>
            <span style={{ color: '#0f0', marginRight: '8px' }}>$</span>
            <div style={{ position: 'relative', width: '100%' }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', width: '100%', position: 'absolute', zIndex: 2 }}
                />
                <div style={{ position: 'absolute', color: '#555', pointerEvents: 'none', zIndex: 1 }}>
                    <span style={{ visibility: 'hidden' }}>{input}</span>{suggestion}
                </div>
            </div>
        </div>
    );
};
