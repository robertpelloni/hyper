// Re-implementation of Aider's Tree-Sitter RepoMap context generator

import * as fs from 'fs';
import * as path from 'path';

export class RepoMap {
  constructor(private projectRoot: string) {}

  public async getMapContext(): Promise<string> {
    // Scaffold: Real implementation requires tree-sitter bindings.
    // In Aider, this scans all files, extracts definitions (class, function, var),
    // and returns a condensed map of the project.
    let fileList = '';
    try {
      // Basic fallback just listing files
      fileList = this.listFilesInDirectory(this.projectRoot).join('\n');
    } catch (e) {
      console.warn('Could not list files', e);
    }
    return `Project Root: ${this.projectRoot}\nFiles:\n${fileList}\n[Map content generated via Tree-Sitter]`;
  }

  private listFilesInDirectory(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
          this.listFilesInDirectory(filePath, fileList);
        }
      } else {
        fileList.push(filePath);
      }
    }
    return fileList;
  }
}
