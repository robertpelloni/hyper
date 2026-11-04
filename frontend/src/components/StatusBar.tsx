import React from "react";
import type { SessionInfo } from "../types";
import Tooltip from "./Tooltip";

interface StatusBarProps {
	sessions: SessionInfo[];
	agentStatus: string;
	dashboardOpen: boolean;
	onToggleDashboard: () => void;
}

export default function StatusBar({
	sessions,
	agentStatus,
	dashboardOpen,
	onToggleDashboard,
}: StatusBarProps) {
	return (
		<div className="tn_status_bar">
			<div className="tn_status_item" onClick={onToggleDashboard} style={{ cursor: "pointer" }}>
				<div
					className={`tn_status_indicator ${agentStatus === "running" ? "active" : ""}`}
				/>
				<span>Agent: {agentStatus}</span>
				<Tooltip text="Click to view Agent Harness details in Mission Control" />
			</div>

			<div className="tn_status_item">
				<span>Sessions: {sessions.length}</span>
				<Tooltip text="Active pseudo-terminals managed by the Go core" />
			</div>

			<div className="tn_status_item">
				<span
					className="tn_status_link"
					onClick={onToggleDashboard}
					title="Click to toggle Mission Control"
				>
					{dashboardOpen ? "[View Terminal]" : "[Mission Control]"}
				</span>
			</div>

			<div className="tn_status_item" style={{ marginLeft: "auto" }}>
				<span>TormentNexus v1.0.0</span>
				<Tooltip text="TormentNexus Unified Autonomous Harness & Terminal" />
			</div>
		</div>
	);
}
