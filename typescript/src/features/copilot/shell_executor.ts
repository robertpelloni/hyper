import * as readline from 'readline';
import { exec } from 'child_process';

export class ShellExecutor {
    private rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    public async executeWithConfirmation(command: string, explanation: string): Promise<boolean> {
        console.log(`\nSuggestion: ${command}`);
        console.log(`Explanation: ${explanation}`);

        return new Promise((resolve) => {
            this.rl.question('\nExecute this command? [y/N] ', (answer) => {
                if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                    console.log(`Executing: ${command}...`);
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error: ${error.message}`);
                        }
                        if (stderr) {
                            console.error(`Stderr: ${stderr}`);
                        }
                        console.log(stdout);
                        resolve(true);
                    });
                } else {
                    console.log('Command execution cancelled.');
                    resolve(false);
                }
            });
        });
    }
}