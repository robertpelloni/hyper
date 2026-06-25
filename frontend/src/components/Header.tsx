import React, { useState, useRef, useEffect } from "react";
import type { SessionInfo } from "../types";

interface HeaderProps {
	sessions: SessionInfo[];
	activeSessionId: string | null;
	maximized: boolean;
	onNewTab: () => void;
	onSelectTab: (uid: string) => void;
	onCloseTab: (uid: string) => void;
	onMinimise: () => void;
	onMaximise: () => void;
	onClose: () => void;
	onOpenConfig: () => void;
	onAgentCheck: () => void;
}

export default function Header({
	sessions,
	activeSessionId,
	maximized,
	onNewTab,
	onSelectTab,
	onCloseTab,
	onMinimise,
	onMaximise,
	onClose,
	onOpenConfig,
	onAgentCheck,
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
						title="Menu"
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
									onNewTab();
									setShowHamburger(false);
								}}
							>
								New Tab
							</div>
							<div
								className="tn_profile_item"
								onClick={() => {
									onOpenConfig();
									setShowHamburger(false);
								}}
							>
								Preferences
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
								onClick={() => setShowHamburger(false)}
							>
								About TormentNexus
							</div>
						</div>
					)}
				</div>
			)}

			{/* Tab Bar */}
			<ul className="tn_tabs">
				{sessions.map((session) => (
					<li
						key={session.uid}
						className={`tn_tab ${session.uid === activeSessionId ? "active" : ""}`}
						onClick={() => onSelectTab(session.uid)}
						onAuxClick={(e) => {
							// Middle-click to close tab
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
