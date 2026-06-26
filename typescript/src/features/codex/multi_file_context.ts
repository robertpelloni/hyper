import * as fs from 'fs';
import * as path from 'path';

export class MultiFileContext {
    public gatherContext(directory: string, maxFiles: number = 10): string {
        let context = '';
        let fileCount = 0;

        const files = fs.readdirSync(directory);
        for (const file of files) {
            if (fileCount >= maxFiles) break;

            const fullPath = path.join(directory, file);
            if (fs.statSync(fullPath).isFile() && !file.startsWith('.')) {
                context += `\n--- File: ${file} ---\n`;
                context += fs.readFileSync(fullPath, 'utf8').substring(0, 1000); // Only first 1000 chars
                fileCount++;
            }
        }
        return context;
    }
}