import React from "react";
import type { CommandBlock } from "../types/CommandBlock";

interface CommandBlockProps {
	blocks: CommandBlock[];
	onClear?: () => void;
}

export default function CommandBlock({ blocks, onClear }: CommandBlockProps) {
	if (blocks.length === 0) return null;

	return (
		<div
			className="tn_blocks_overlay"
			style={{
				position: "absolute",
				top: 0,
				right: 0,
				width: "300px",
				maxHeight: "100%",
				overflowY: "auto",
				backgroundColor: "rgba(30, 30, 30, 0.95)",
				borderLeft: "1px solid #444",
				color: "#eee",
				zIndex: 10,
				display: "flex",
				flexDirection: "column",
				boxShadow: "-2px 0 5px rgba(0,0,0,0.3)",
			}}
		>
			<div
				style={{
					padding: "12px",
					fontWeight: "bold",
					borderBottom: "1px solid #444",
					backgroundColor: "#252526",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<span>Semantic Blocks</span>
				{onClear && (
					<button
						onClick={onClear}
						style={{
							background: "none",
							border: "none",
							color: "#888",
							cursor: "pointer",
						}}
					>
						Clear
					</button>
				)}
			</div>
			<div style={{ padding: "8px", flex: 1, overflowY: "auto" }}>
				{blocks.map((block) => (
					<div
						key={block.id}
						style={{
							marginBottom: "12px",
							padding: "10px",
							backgroundColor: "#2d2d2d",
							borderRadius: "4px",
							border: "1px solid #444",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: "6px",
							}}
						>
							<div
								style={{
									fontFamily: "monospace",
									fontSize: "13px",
									color: block.success ? "#4caf50" : "#f44336",
									fontWeight: "bold",
								}}
							>
								$ {block.command}
							</div>
							<div style={{ fontSize: "10px", color: "#888" }}>
								{new Date(block.timestamp).toLocaleTimeString()}
							</div>
						</div>
						{block.aiAnnotations && block.aiAnnotations.length > 0 && (
							<div
								style={{
									marginBottom: "6px",
									padding: "6px",
									backgroundColor: "#2a2d3e",
									borderRadius: "3px",
									fontSize: "11px",
									color: "#b392f0",
								}}
							>
								<strong>AI Insight:</strong> {block.aiAnnotations.join(", ")}
							</div>
						)}
						<div
							style={{
								fontSize: "12px",
								color: "#ccc",
								whiteSpace: "pre-wrap",
								maxHeight: "150px",
								overflowY: "auto",
								backgroundColor: "#1e1e1e",
								padding: "6px",
								borderRadius: "3px",
							}}
						>
							{block.output}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
