import {useEffect, useRef, useCallback, useState} from 'react';
import React from 'react';

import * as api from '../api';
import type {SessionInfo, AppConfig} from '../types';

interface TermProps {
  uid: string;
  session: SessionInfo;
  config: AppConfig;
  isActive: boolean;
  onTitle: (title: string) => void;
  onToggleSearch: (value: boolean) => void;
}

export default function Term({uid, session, config, isActive, onTitle, onToggleSearch}: TermProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const searchAddonRef = useRef<any>(null);
  const webglAddonRef = useRef<any>(null);
  const canvasAddonRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Initialize xterm.js terminal
  useEffect(() => {
    if (!terminalRef.current || isInitializedRef.current) return;
    isInitializedRef.current = true;

    let term: any;
    let fitAddon: any;
    let searchAddon: any;
    let webLinksAddon: any;

    const initTerminal = async () => {
      // Dynamically import xterm and addons
      const {Terminal} = await import('@xterm/xterm');
      const {FitAddon} = await import('@xterm/addon-fit');
      const {SearchAddon} = await import('@xterm/addon-search');
      const {WebLinksAddon} = await import('@xterm/addon-web-links');
      const {Unicode11Addon} = await import('@xterm/addon-unicode11');

      const cursorStyles: Record<string, string> = {
        BLOCK: 'block',
        BEAM: 'bar',
        UNDERLINE: 'underline'
      };

      const colors = config.colors || {};

      term = new Terminal({
        allowProposedApi: true,
        allowTransparency: true,
        scrollback: config.scrollback || 1000,
        cursorStyle: cursorStyles[config.cursorShape || 'BLOCK'] as any,
        cursorBlink: config.cursorBlink || false,
        fontFamily: config.fontFamily || `Menlo, "DejaVu Sans Mono", Consolas, "Lucida Console", monospace`,
        fontSize: config.fontSize || 12,
        fontWeight: (config.fontWeight as any) || 'normal',
        fontWeightBold: (config.fontWeightBold as any) || 'bold',
        lineHeight: config.lineHeight || 1,
        letterSpacing: config.letterSpacing || 0,
        theme: {
          foreground: config.foregroundColor || '#fff',
          background: config.backgroundColor || '#000',
          cursor: config.cursorColor || 'rgba(248,28,229,0.8)',
          cursorAccent: config.cursorAccentColor || '#000',
          selectionBackground: config.selectionColor || 'rgba(248,28,229,0.3)',
          black: colors.black || '#000000',
          red: colors.red || '#C51E14',
          green: colors.green || '#1DC121',
          yellow: colors.yellow || '#C7C329',
          blue: colors.blue || '#0A2FC4',
          magenta: colors.magenta || '#C839C5',
          cyan: colors.cyan || '#20C5C6',
          white: colors.white || '#C7C7C7',
          brightBlack: colors.lightBlack || '#686868',
          brightRed: colors.lightRed || '#FD6F6B',
          brightGreen: colors.lightGreen || '#67F86F',
          brightYellow: colors.lightYellow || '#FFFA72',
          brightBlue: colors.lightBlue || '#6A76FB',
          brightMagenta: colors.lightMagenta || '#FD7CFC',
          brightCyan: colors.lightCyan || '#68FDFE',
          brightWhite: colors.lightWhite || '#FFFFFF'
        }
      });

      // Addons
      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      searchAddon = new SearchAddon();
      term.loadAddon(searchAddon);

      webLinksAddon = new WebLinksAddon();
      term.loadAddon(webLinksAddon);

      const unicode11Addon = new Unicode11Addon();
      term.loadAddon(unicode11Addon);
      term.unicode.activeVersion = '11';

      // Try to load WebGL renderer
      if (config.webGLRenderer) {
        try {
          const {WebglAddon} = await import('@xterm/addon-webgl');
          const webglAddon = new WebglAddon();
          webglAddon.onContextLoss(() => {
            webglAddon.dispose();
            webglAddonRef.current = null;
          });
          term.loadAddon(webglAddon);
          webglAddonRef.current = webglAddon;
        } catch {
          // Fall back to canvas renderer
          try {
            const {CanvasAddon} = await import('@xterm/addon-canvas');
            const canvasAddon = new CanvasAddon();
            term.loadAddon(canvasAddon);
            canvasAddonRef.current = canvasAddon;
          } catch {
            // Use default DOM renderer
          }
        }
      } else {
        // Try canvas renderer as better-than-DOM fallback
        try {
          const {CanvasAddon} = await import('@xterm/addon-canvas');
          const canvasAddon = new CanvasAddon();
          term.loadAddon(canvasAddon);
          canvasAddonRef.current = canvasAddon;
        } catch {
          // Use default DOM renderer
        }
      }

      // Open terminal in container
      if (terminalRef.current) {
        term.open(terminalRef.current);
        fitAddon.fit();
      }

      // Store refs
      termInstanceRef.current = term;
      fitAddonRef.current = fitAddon;
      searchAddonRef.current = searchAddon;

      // Handle user input -> send to Go backend
      term.onData((data: string) => {
        api.writeSessionData(uid, data);
      });

      // Handle resize
      term.onResize(({cols, rows}: {cols: number; rows: number}) => {
        api.resizeSession(uid, rows, cols);
      });

      // Handle title change
      term.onTitleChange((title: string) => {
        onTitle(title);
      });

      // Handle selection for copy-on-select
      if (config.copyOnSelect) {
        term.onSelectionChange(() => {
          if (term.hasSelection()) {
            const text = term.getSelection();
            navigator.clipboard.writeText(text).catch(() => {});
          }
        });
      }

      // Handle right-click paste
      terminalRef.current?.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        navigator.clipboard
          .readText()
          .then((text) => {
            if (text) {
              // Handle escaped paste
              const escaped = session.shell?.endsWith('cmd.exe') ? `"${text}"` : `'${text.replace(/'/g, `'\\''`)}'`;
              api.writeSessionData(uid, escaped || text);
            }
          })
          .catch(() => {});
      });

      // Fit on resize
      const resizeObserver = new ResizeObserver(() => {
        if (fitAddon) {
          try {
            fitAddon.fit();
          } catch {
            // terminal might be disposed
          }
        }
      });

      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }

      // Clean up
      return () => {
        resizeObserver.disconnect();
      };
    };

    initTerminal();

    return () => {
      if (termInstanceRef.current) {
        try {
          termInstanceRef.current.dispose();
        } catch (_e) {
          /* terminal already disposed */
        }
        termInstanceRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [uid]); // Only re-init when session ID changes

  // Listen for session data from Go backend
  useEffect(() => {
    const handler = (e: Event) => {
      const {sessionId, data} = (e as CustomEvent).detail;
      if (sessionId === uid && termInstanceRef.current) {
        termInstanceRef.current.write(data);
      }
    };

    window.addEventListener('tn:session-data', handler);
    return () => window.removeEventListener('tn:session-data', handler);
  }, [uid]);

  // Handle clear buffer
  useEffect(() => {
    const handler = () => {
      if (isActive && termInstanceRef.current) {
        termInstanceRef.current.clear();
      }
    };
    window.addEventListener('tn:clear-active', handler);
    return () => window.removeEventListener('tn:clear-active', handler);
  }, [isActive]);

  // Update terminal options when config changes
  useEffect(() => {
    const term = termInstanceRef.current;
    if (!term) return;

    const cursorStyles: Record<string, string> = {
      BLOCK: 'block',
      BEAM: 'bar',
      UNDERLINE: 'underline'
    };

    try {
      if (config.fontSize) term.options.fontSize = config.fontSize;
      if (config.fontFamily) term.options.fontFamily = config.fontFamily;
      if (config.fontWeight) term.options.fontWeight = config.fontWeight as any;
      if (config.fontWeightBold) term.options.fontWeightBold = config.fontWeightBold as any;
      if (config.lineHeight) term.options.lineHeight = config.lineHeight;
      if (config.letterSpacing !== undefined) term.options.letterSpacing = config.letterSpacing;
      if (config.cursorBlink !== undefined) term.options.cursorBlink = config.cursorBlink;
      if (config.cursorShape) term.options.cursorStyle = cursorStyles[config.cursorShape] as any;
      if (config.scrollback) term.options.scrollback = config.scrollback;

      // Update theme
      const colors = config.colors || {};
      term.options.theme = {
        foreground: config.foregroundColor || '#fff',
        background: config.backgroundColor || '#000',
        cursor: config.cursorColor || 'rgba(248,28,229,0.8)',
        cursorAccent: config.cursorAccentColor || '#000',
        selectionBackground: config.selectionColor || 'rgba(248,28,229,0.3)',
        black: colors.black || '#000000',
        red: colors.red || '#C51E14',
        green: colors.green || '#1DC121',
        yellow: colors.yellow || '#C7C329',
        blue: colors.blue || '#0A2FC4',
        magenta: colors.magenta || '#C839C5',
        cyan: colors.cyan || '#20C5C6',
        white: colors.white || '#C7C7C7',
        brightBlack: colors.lightBlack || '#686868',
        brightRed: colors.lightRed || '#FD6F6B',
        brightGreen: colors.lightGreen || '#67F86F',
        brightYellow: colors.lightYellow || '#FFFA72',
        brightBlue: colors.lightBlue || '#6A76FB',
        brightMagenta: colors.lightMagenta || '#FD7CFC',
        brightCyan: colors.lightCyan || '#68FDFE',
        brightWhite: colors.lightWhite || '#FFFFFF'
      };

      // Re-fit after option changes
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (_e) {
          /* fit failed */
        }
      }
    } catch (err) {
      console.warn('Failed to update terminal options:', err);
    }
  }, [config]);

  // Focus active terminal
  useEffect(() => {
    if (isActive && termInstanceRef.current) {
      termInstanceRef.current.focus();
    }
  }, [isActive]);

  // Search functionality
  const handleSearch = useCallback(() => {
    if (searchAddonRef.current && searchText) {
      searchAddonRef.current.findNext(searchText);
    }
  }, [searchText]);

  const handleSearchPrev = useCallback(() => {
    if (searchAddonRef.current && searchText) {
      searchAddonRef.current.findPrevious(searchText);
    }
  }, [searchText]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          handleSearchPrev();
        } else {
          handleSearch();
        }
      }
      if (e.key === 'Escape') {
        setSearchVisible(false);
        onToggleSearch(false);
        if (termInstanceRef.current) {
          termInstanceRef.current.focus();
        }
      }
    },
    [handleSearch, handleSearchPrev, onToggleSearch]
  );

  // Show search when session.search changes
  useEffect(() => {
    if (session.search) {
      setSearchVisible(true);
    }
  }, [session.search]);

  // Expose focus method
  useEffect(() => {
    (window as any).focusActiveTerm = (targetUid?: string) => {
      if (targetUid === uid || (!targetUid && isActive)) {
        termInstanceRef.current?.focus();
      }
    };
  }, [uid, isActive]);

  const padding = config.padding || '12px 14px';

  return (
    <div style={{width: '100%', height: '100%', position: 'relative'}}>
      <div ref={terminalRef} className="tn_term_container" style={{padding}} />
      {searchVisible && (
        <div className="tn_search_box">
          <input
            className="tn_search_input"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search..."
            autoFocus
          />
          <button className="tn_search_btn" onClick={handleSearchPrev} title="Previous (Shift+Enter)">
            ↑
          </button>
          <button className="tn_search_btn" onClick={handleSearch} title="Next (Enter)">
            ↓
          </button>
          <button
            className="tn_search_btn"
            onClick={() => {
              setSearchVisible(false);
              onToggleSearch(false);
              termInstanceRef.current?.focus();
            }}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
