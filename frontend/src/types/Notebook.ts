import type { CommandBlock } from "./CommandBlock";

export type CellType = "markdown" | "code" | "terminal";

export interface NotebookCell {
	id: string;
	type: CellType;
	content: string; // Markdown text or command to execute
	blocks?: CommandBlock[]; // Results of execution if type === "terminal" or "code"
}

export interface Notebook {
	id: string;
	title: string;
	cells: NotebookCell[];
}
