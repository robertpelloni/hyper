import React, { useState, useRef, useEffect } from "react";
import type { SessionInfo } from "../types";
import Tooltip from "./Tooltip";

interface HeaderProps {
	sessions: SessionInfo[];
	activeSessionId: string | null;
	maximized: boolean;
	dashboardOpen: boolean;
	onToggleDashboard: () => void;
	onNewTab: () => void;
	onSelectTab: (uid: string) => void;
	onCloseTab: (uid: string) => void;
	onMinimise: () => void;
	onMaximise: () => void;
	onClose: () => void;
	onOpenConfig: () => void;
	onAgentCheck: () => void;
	onRestartServers: () => void;
}

export default function Header({
	sessions,
	activeSessionId,
	maximized,
	dashboardOpen,
	onToggleDashboard,
	onNewTab,
	onSelectTab,
	onCloseTab,
	onMinimise,
	onMaximise,
	onClose,
	onOpenConfig,
	onAgentCheck,
	onRestartServers,
}: HeaderProps) {
	const [showHamburger, setShowHamburger] = useState(false);
	const hamburgerRef = useRef<HTMLDivElement>(null);

	// Close hamburger menu on outside click
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (
				hamburgerRef.current &&
				!hamburgerRef.current.contains(e.target as Node)
			) {
				setShowHamburger(false);
			}
		};
		if (showHamburger) {
			document.addEventListener("mousedown", handleClick);
			return () => document.removeEventListener("mousedown", handleClick);
		}
	}, [showHamburger]);

	const isMac = navigator.platform.toLowerCase().includes("mac");

	return (
		<div className={`tn_header ${isMac ? "tn_header_mac" : ""}`}>
			{/* Hamburger Menu Button (non-macOS) */}
			{!isMac && (
				<div ref={hamburgerRef} style={{ position: "relative" }}>
					<div
						className="tn_hamburger_btn"
						onClick={() => setShowHamburger(!showHamburger)}
						title="TormentNexus Master Menu"
					>
						☰
					</div>
					{showHamburger && (
						<div
							className="tn_profile_dropdown"
							style={{ left: 0, top: "34px" }}
						>
							<div
								className="tn_profile_item"
								onClick={() => {
									onToggleDashboard();
									setShowHamburger(false);
								}}
							>
								{dashboardOpen ? "Show Terminal View" : "Mission Control Dashboard"}
							</div>
							<div
								className="tn_profile_item"
								onClick={() => {
									onNewTab();
									setShowHamburger(false);
								}}
							>
								New Tab (Ctrl+Shift+T)
							</div>
							<div
								className="tn_profile_item"
								onClick={() => {
									onOpenConfig();
									setShowHamburger(false);
								}}
							>
								Preferences (Ctrl+,)
							</div>
							<div
								className="tn_profile_item"
								onClick={() => {
									onAgentCheck();
									setShowHamburger(false);
								}}
							>
								Agent Health Check
							</div>
							<div
								className="tn_profile_item"
								onClick={() => {
									onRestartServers();
									setShowHamburger(false);
								}}
							>
								Restart MCP Server
							</div>
						</div>
					)}
				</div>
			)}

			{/* Mission Control Quick Button */}
			<button
				className={`tn_header_dashboard_btn ${dashboardOpen ? "active" : ""}`}
				onClick={onToggleDashboard}
				title="Toggle Unified Mission Control Dashboard"
			>
				⚡ Dashboard
			</button>

			{/* Tab Bar */}
			<ul className="tn_tabs">
				{sessions.map((session) => (
					<li
						key={session.uid}
						className={`tn_tab ${session.uid === activeSessionId && !dashboardOpen ? "active" : ""}`}
						onClick={() => {
							if (dashboardOpen) onToggleDashboard();
							onSelectTab(session.uid);
						}}
						onAuxClick={(e) => {
							if (e.button === 1) {
								e.preventDefault();
								onCloseTab(session.uid);
							}
						}}
					>
						<span className="tn_tab_title">{session.title || "Shell"}</span>
						{sessions.length > 1 && (
							<span
								className="tn_tab_close"
								onClick={(e) => {
									e.stopPropagation();
									onCloseTab(session.uid);
								}}
							>
								×
							</span>
						)}
					</li>
				))}
			</ul>

			{/* New Tab Button */}
			<div
				className="tn_new_tab_btn"
				onClick={onNewTab}
				title="New Tab (Ctrl+Shift+T)"
			>
				+
			</div>

			{/* Window Controls (non-macOS) */}
			{!isMac && (
				<div className="tn_window_controls">
					<div className="tn_window_btn" onClick={onMinimise} title="Minimize">
						─
					</div>
					<div
						className="tn_window_btn"
						onClick={onMaximise}
						title={maximized ? "Restore" : "Maximize"}
					>
						{maximized ? "❐" : "□"}
					</div>
					<div className="tn_window_btn close" onClick={onClose} title="Close">
						✕
					</div>
				</div>
			)}
		</div>
	);
}
