import React, {useCallback, useRef, useEffect, useState} from 'react';
import type {SessionInfo, AppConfig, TermColors} from '../types';
import Term from './Term';

interface TermsProps {
  sessions: Record<string, SessionInfo>;
  activeSessionId: string | null;
  config: AppConfig;
  onActive: (uid: string) => void;
  onTitle: (uid: string, title: string) => void;
  onToggleSearch: (uid: string, value: boolean) => void;
}

export default function Terms({sessions, activeSessionId, config, onActive, onTitle, onToggleSearch}: TermsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitSessions, setSplitSessions] = useState<string[]>([]);

  const sessionIds = Object.keys(sessions);

  // Handle split pane creation
  const handleSplit = useCallback((direction: 'horizontal' | 'vertical') => {
    // For now, simple tab-based layout (split panes are a future enhancement)
    // This matches the original behavior where each "tab" shows one term
  }, []);

  // Listen for clear buffer events
  useEffect(() => {
    const handler = () => {
      window.dispatchEvent(new CustomEvent('tn:clear-active'));
    };
    window.addEventListener('tn:clear-buffer', handler);
    return () => window.removeEventListener('tn:clear-buffer', handler);
  }, []);

  if (sessionIds.length === 0) {
    return (
      <div className="tn_terms" ref={containerRef}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666',
            fontFamily: config.fontFamily || 'monospace',
            fontSize: config.fontSize || 12
          }}
        >
          No active sessions
        </div>
      </div>
    );
  }

  return (
    <div className="tn_terms" ref={containerRef}>
      {sessionIds.map((uid) => {
        const session = sessions[uid];
        const isActive = uid === activeSessionId;

        return (
          <div
            key={uid}
            className="tn_term_pane"
            style={{
              display: isActive ? 'flex' : 'none'
            }}
            onClick={() => onActive(uid)}
          >
            <Term
              uid={uid}
              session={session}
              config={config}
              isActive={isActive}
              onTitle={(title) => onTitle(uid, title)}
              onToggleSearch={(value) => onToggleSearch(uid, value)}
            />
          </div>
        );
      })}
    </div>
  );
}
