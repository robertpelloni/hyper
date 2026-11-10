import React, { useState, useEffect, useRef, useCallback } from "react";
import type { AppConfig, SessionInfo, TermColors, Notification } from "./types";
import * as api from "./api";
import Header from "./components/Header";
import Terms from "./components/Terms";
import StatusBar from "./components/StatusBar";
import Notifications from "./components/Notifications";
import Dashboard from "./components/Dashboard";

const DEFAULT_COLORS: TermColors = {
	black: "#000000",
	red: "#C51E14",
	green: "#1DC121",
	yellow: "#C7C329",
	blue: "#0A2FC4",
	magenta: "#C839C5",
	cyan: "#20C5C6",
	white: "#C7C7C7",
	lightBlack: "#686868",
	lightRed: "#FD6F6B",
	lightGreen: "#67F86F",
	lightYellow: "#FFFA72",
	lightBlue: "#6A76FB",
	lightMagenta: "#FD7CFC",
	lightCyan: "#68FDFE",
	lightWhite: "#FFFFFF",
};

const DEFAULT_CONFIG: AppConfig = {
	fontSize: 12,
	fontFamily: `Menlo, "DejaVu Sans Mono", Consolas, "Lucida Console", monospace`,
	fontWeight: "normal",
	fontWeightBold: "bold",
	lineHeight: 1,
	letterSpacing: 0,
	scrollback: 1000,
	cursorColor: "rgba(248,28,229,0.8)",
	cursorAccentColor: "#000",
	cursorShape: "BLOCK",
	cursorBlink: false,
	foregroundColor: "#fff",
	backgroundColor: "#000",
	selectionColor: "rgba(248,28,229,0.3)",
	borderColor: "#333",
	padding: "12px 14px",
	colors: DEFAULT_COLORS,
	shell: "",
	shellArgs: ["--login"],
	bell: "SOUND",
	copyOnSelect: false,
	quickEdit: false,
	webGLRenderer: false,
	disableLigatures: true,
	imageSupport: true,
	defaultProfile: "default",
	profiles: [{ name: "default", config: {} }],
};

export interface AppState {
	config: AppConfig;
	sessions: Record<string, SessionInfo>;
	activeSessionId: string | null;
	termGroups: Record<string, any>;
	activeRootGroup: string | null;
	maximized: boolean;
	fullScreen: boolean;
	notifications: Notification[];
	agentRunning: boolean;
	agentStatus: string;
	dashboardOpen: boolean;
}

export default function App() {
	const [state, setState] = useState<AppState>({
		config: DEFAULT_CONFIG,
		sessions: {},
		activeSessionId: null,
		termGroups: {},
		activeRootGroup: null,
		maximized: false,
		fullScreen: false,
		notifications: [],
		agentRunning: false,
		agentStatus: "idle",
		dashboardOpen: false,
	});

	const sessionsRef = useRef(state.sessions);
	sessionsRef.current = state.sessions;

	// Load config on mount
	useEffect(() => {
		loadConfig();
		// Create initial session
		createNewSession();
	}, []);

	// Listen for session and server events from Go backend
	useEffect(() => {
		api.onEvent("session:data", (sessionId: string, data: string) => {
			window.dispatchEvent(
				new CustomEvent("tn:session-data", {
					detail: { sessionId, data },
				}),
			);
		});

		api.onEvent("session:exit", (sessionId: string) => {
			setState((prev) => {
				const newSessions = { ...prev.sessions };
				delete newSessions[sessionId];
				const sessionKeys = Object.keys(newSessions);
				return {
					...prev,
					sessions: newSessions,
					activeSessionId: sessionKeys.length > 0 ? sessionKeys[0] : null,
				};
			});
		});

		api.onEvent("server:status_changed", (srvStatus: any) => {
			if (srvStatus) {
				setState((prev) => ({
					...prev,
					agentRunning: srvStatus.agentRunning,
					agentStatus: srvStatus.agentRunning ? "running" : "idle",
				}));
			}
		});

		return () => {
			api.offEvent("session:data");
			api.offEvent("session:exit");
			api.offEvent("server:status_changed");
		};
	}, []);

	const loadConfig = async () => {
		try {
			const cfg = await api.getConfig();
			setState((prev) => ({
				...prev,
				config: { ...DEFAULT_CONFIG, ...cfg },
			}));
		} catch (err) {
			console.warn("Could not load config, using defaults:", err);
		}
	};

	const createNewSession = useCallback(
		async (profile?: string) => {
			try {
				const cwd = state.config.workingDirectory || "";
				const sessionInfo = await api.createSession({
					shell: state.config.shell || "",
					args: state.config.shellArgs || [],
					cwd,
					rows: 24,
					cols: 80,
					profile: profile || "default",
				});

				const newSession: SessionInfo = {
					uid: sessionInfo.uid,
					shell: sessionInfo.shell,
					pid: sessionInfo.pid,
					rows: sessionInfo.rows,
					cols: sessionInfo.cols,
					profile: sessionInfo.profile || "default",
					title: "Shell",
					search: false,
					hasActivity: false,
				};

				setState((prev) => ({
					...prev,
					sessions: { ...prev.sessions, [newSession.uid]: newSession },
					activeSessionId: newSession.uid,
				}));

				// Listen for data from this specific session
				api.onEvent(`session:data:${newSession.uid}`, (data: string) => {
					window.dispatchEvent(
						new CustomEvent("tn:session-data", {
							detail: { sessionId: newSession.uid, data },
						}),
					);
				});

				api.onEvent(`session:exit:${newSession.uid}`, () => {
					setState((prev) => {
						const newSessions = { ...prev.sessions };
						delete newSessions[newSession.uid];
						const sessionKeys = Object.keys(newSessions);
						return {
							...prev,
							sessions: newSessions,
							activeSessionId:
								prev.activeSessionId === newSession.uid
									? sessionKeys.length > 0
										? sessionKeys[0]
										: null
									: prev.activeSessionId,
						};
					});
				});

				return newSession;
			} catch (err) {
				console.error("Failed to create session:", err);
				addNotification(`Failed to create session: ${err}`);
				return null;
			}
		},
		[state.config],
	);

	const closeSession = useCallback(
		async (uid: string) => {
			try {
				await api.closeSession(uid);
				api.offEvent(`session:data:${uid}`);
				api.offEvent(`session:exit:${uid}`);

				setState((prev) => {
					const newSessions = { ...prev.sessions };
					delete newSessions[uid];
					const sessionKeys = Object.keys(newSessions);

					if (sessionKeys.length === 0) {
						setTimeout(() => createNewSession(), 100);
						return {
							...prev,
							sessions: newSessions,
							activeSessionId: null,
						};
					}

					return {
						...prev,
						sessions: newSessions,
						activeSessionId:
							prev.activeSessionId === uid
								? sessionKeys[0]
								: prev.activeSessionId,
					};
				});
			} catch (err) {
				console.error("Failed to close session:", err);
			}
		},
		[createNewSession],
	);

	const setActiveSession = useCallback((uid: string) => {
		setState((prev) => ({ ...prev, activeSessionId: uid }));
	}, []);

	const setSessionTitle = useCallback((uid: string, title: string) => {
		setState((prev) => ({
			...prev,
			sessions: {
				...prev.sessions,
				[uid]: { ...prev.sessions[uid], title },
			},
		}));
	}, []);

	const toggleSearch = useCallback((uid: string, value: boolean) => {
		setState((prev) => ({
			...prev,
			sessions: {
				...prev.sessions,
				[uid]: { ...prev.sessions[uid], search: value },
			},
		}));
	}, []);

	const handleWindowMinimise = useCallback(() => {
		api.windowMinimise();
	}, []);

	const handleWindowMaximise = useCallback(() => {
		if (state.maximized) {
			api.windowUnmaximise();
		} else {
			api.windowMaximise();
		}
		setState((prev) => ({ ...prev, maximized: !prev.maximized }));
	}, [state.maximized]);

	const handleWindowClose = useCallback(() => {
		api.windowClose();
	}, []);

	const handleOpenConfig = useCallback(async () => {
		try {
			await api.openConfigInEditor();
		} catch (err) {
			console.error("Failed to open config:", err);
		}
	}, []);

	const handleAgentHealthCheck = useCallback(async () => {
		try {
			const status = await api.agentHealthCheck();
			addNotification(
				`Agent Status: ${status.status} | Tools: ${status.messages} | Running: ${status.running}`,
			);
		} catch (err) {
			addNotification(`Agent Error: ${err}`);
		}
	}, []);

	const handleRestartServers = useCallback(async () => {
		try {
			await api.restartServers();
			addNotification("MCP Servers restarted cleanly (:8080)");
		} catch (err) {
			addNotification(`Server restart error: ${err}`);
		}
	}, []);

	const toggleDashboard = useCallback(() => {
		setState((prev) => ({ ...prev, dashboardOpen: !prev.dashboardOpen }));
	}, []);

	const addNotification = useCallback(
		(text: string, url?: string | null, dismissable: boolean = true) => {
			const notif: Notification = {
				id: Date.now().toString() + Math.random().toString(36).slice(2),
				text,
				url,
				dismissable,
				timestamp: Date.now(),
			};
			setState((prev) => ({
				...prev,
				notifications: [...prev.notifications, notif],
			}));

			if (dismissable) {
				setTimeout(() => {
					dismissNotification(notif.id);
				}, 5000);
			}
		},
		[],
	);

	const dismissNotification = useCallback((id: string) => {
		setState((prev) => ({
			...prev,
			notifications: prev.notifications.filter((n) => n.id !== id),
		}));
	}, []);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const ctrl = e.ctrlKey;
			const shift = e.shiftKey;

			// Ctrl+Shift+D: Toggle Mission Control Dashboard
			if (ctrl && shift && e.key === "D") {
				e.preventDefault();
				toggleDashboard();
				return;
			}

			// Ctrl+Shift+T: New tab
			if (ctrl && shift && e.key === "T") {
				e.preventDefault();
				createNewSession();
				return;
			}

			// Ctrl+Shift+W: Close tab
			if (ctrl && shift && e.key === "W") {
				e.preventDefault();
				if (state.activeSessionId) {
					closeSession(state.activeSessionId);
				}
				return;
			}

			// Ctrl+Tab: Next tab
			if (ctrl && !shift && e.key === "Tab") {
				e.preventDefault();
				const sessionKeys = Object.keys(state.sessions);
				if (sessionKeys.length > 1 && state.activeSessionId) {
					const currentIdx = sessionKeys.indexOf(state.activeSessionId);
					const nextIdx = (currentIdx + 1) % sessionKeys.length;
					setActiveSession(sessionKeys[nextIdx]);
				}
				return;
			}

			// Ctrl+,: Preferences
			if (ctrl && e.key === ",") {
				e.preventDefault();
				handleOpenConfig();
				return;
			}

			// F11: Fullscreen
			if (e.key === "F11") {
				e.preventDefault();
				if (state.fullScreen) {
					api.windowUnfullscreen();
				} else {
					api.windowFullscreen();
				}
				setState((prev) => ({ ...prev, fullScreen: !prev.fullScreen }));
				return;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		state.activeSessionId,
		state.sessions,
		state.maximized,
		state.fullScreen,
		createNewSession,
		closeSession,
		setActiveSession,
		handleOpenConfig,
		toggleDashboard,
	]);

	const {
		config,
		sessions,
		activeSessionId,
		maximized,
		fullScreen,
		notifications,
		dashboardOpen,
	} = state;
	const sessionList = Object.values(sessions);

	return (
		<div
			className={`tn_main ${maximized ? "maximized" : ""} ${fullScreen ? "fullScreen" : ""}`}
			style={{
				borderColor: config.borderColor || "#333",
			}}
		>
			<Header
				sessions={sessionList}
				activeSessionId={activeSessionId}
				maximized={maximized}
				dashboardOpen={dashboardOpen}
				onToggleDashboard={toggleDashboard}
				onNewTab={() => createNewSession()}
				onSelectTab={setActiveSession}
				onCloseTab={closeSession}
				onMinimise={handleWindowMinimise}
				onMaximise={handleWindowMaximise}
				onClose={handleWindowClose}
				onOpenConfig={handleOpenConfig}
				onAgentCheck={handleAgentHealthCheck}
				onRestartServers={handleRestartServers}
			/>

			{dashboardOpen ? (
				<Dashboard
					config={config}
					sessions={sessions}
					activeSessionId={activeSessionId}
					onSelectSession={setActiveSession}
					onCloseSession={closeSession}
					onNewSession={() => createNewSession()}
					onCloseDashboard={() => setState((prev) => ({ ...prev, dashboardOpen: false }))}
					onNotification={addNotification}
				/>
			) : (
				<Terms
					sessions={sessions}
					activeSessionId={activeSessionId}
					config={config}
					onActive={setActiveSession}
					onTitle={setSessionTitle}
					onToggleSearch={toggleSearch}
				/>
			)}

			<StatusBar
				sessions={sessionList}
				agentStatus={state.agentStatus}
				dashboardOpen={dashboardOpen}
				onToggleDashboard={toggleDashboard}
			/>
			<Notifications
				notifications={notifications}
				onDismiss={dismissNotification}
			/>
		</div>
	);
}
