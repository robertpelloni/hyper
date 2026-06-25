export interface CommandBlock {
    id: string;
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    startTime: number;
    endTime: number;
    cwd: string;
}

export class BlockManager {
    private blocks: CommandBlock[] = [];

    public createBlock(command: string, cwd: string): CommandBlock {
        const block: CommandBlock = {
            id: crypto.randomUUID(),
            command,
            stdout: '',
            stderr: '',
            exitCode: -1,
            startTime: Date.now(),
            endTime: 0,
            cwd
        };
        this.blocks.push(block);
        return block;
    }

    public finishBlock(id: string, stdout: string, stderr: string, exitCode: number) {
        const block = this.blocks.find(b => b.id === id);
        if (block) {
            block.stdout = stdout;
            block.stderr = stderr;
            block.exitCode = exitCode;
            block.endTime = Date.now();
        }
    }

    public getBlocks(): CommandBlock[] {
        return this.blocks;
    }
}