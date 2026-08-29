export interface CommandBlock {
	id: string;
	command: string;
	output: string;
	exitCode: number;
	success: boolean;
	timestamp: string;
	durationMs?: number;
	aiAnnotations?: string[];
}
