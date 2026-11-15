import React, { useState } from "react";
import type { Notebook, NotebookCell } from "../types/Notebook";
import CommandBlock from "./CommandBlock";
import * as api from "../api";
import { v4 as uuidv4 } from "uuid";

interface NotebookViewProps {
	notebook: Notebook;
	onUpdate: (notebook: Notebook) => void;
}

export default function NotebookView({ notebook, onUpdate }: NotebookViewProps) {
	const [activeCellId, setActiveCellId] = useState<string | null>(null);

	const addCell = (type: "markdown" | "terminal") => {
		const newCell: NotebookCell = {
			id: uuidv4(),
			type,
			content: "",
			blocks: [],
		};
		onUpdate({ ...notebook, cells: [...notebook.cells, newCell] });
		setActiveCellId(newCell.id);
	};

	const updateCellContent = (id: string, content: string) => {
		onUpdate({
			...notebook,
			cells: notebook.cells.map((c) => (c.id === id ? { ...c, content } : c)),
		});
	};

	const executeCell = async (id: string, command: string) => {
		try {
			const block = await api.executeNotebookCell(command);

			onUpdate({
				...notebook,
				cells: notebook.cells.map((c) =>
					c.id === id ? { ...c, blocks: [...(c.blocks || []), block] } : c
				),
			});
		} catch (error) {
			console.error("Execution failed", error);
		}
	};

	return (
		<div style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", backgroundColor: "#1e1e1e", color: "#eee" }}>
			<h2 style={{ borderBottom: "1px solid #444", paddingBottom: "10px" }}>{notebook.title}</h2>

			<div style={{ flex: 1 }}>
				{notebook.cells.map((cell) => (
					<div key={cell.id} style={{ marginBottom: "20px", border: "1px solid #333", borderRadius: "5px", overflow: "hidden" }}>
						<div style={{ backgroundColor: "#252526", padding: "8px", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between" }}>
							<span style={{ fontSize: "12px", color: "#888", textTransform: "uppercase" }}>{cell.type}</span>
							{cell.type === "terminal" && (
								<button onClick={() => executeCell(cell.id, cell.content)} style={{ background: "none", border: "none", color: "#4caf50", cursor: "pointer" }}>▶ Run</button>
							)}
						</div>

						<div style={{ padding: "10px", backgroundColor: "#1e1e1e" }}>
							<textarea
								value={cell.content}
								onChange={(e) => updateCellContent(cell.id, e.target.value)}
								onFocus={() => setActiveCellId(cell.id)}
								style={{
									width: "100%",
									minHeight: "50px",
									backgroundColor: "transparent",
									border: "none",
									color: "#d4d4d4",
									fontFamily: cell.type === "terminal" ? "monospace" : "sans-serif",
									resize: "vertical",
									outline: "none"
								}}
								placeholder={`Enter ${cell.type} content here...`}
							/>
						</div>

						{cell.type === "terminal" && cell.blocks && cell.blocks.length > 0 && (
							<div style={{ borderTop: "1px solid #333", backgroundColor: "#111", padding: "10px" }}>
								<CommandBlock blocks={cell.blocks} />
							</div>
						)}
					</div>
				))}
			</div>

			<div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
				<button onClick={() => addCell("markdown")} style={{ padding: "8px 16px", backgroundColor: "#333", color: "#eee", border: "none", borderRadius: "4px", cursor: "pointer" }}>+ Markdown</button>
				<button onClick={() => addCell("terminal")} style={{ padding: "8px 16px", backgroundColor: "#0e639c", color: "#eee", border: "none", borderRadius: "4px", cursor: "pointer" }}>+ Terminal</button>
			</div>
		</div>
	);
}
