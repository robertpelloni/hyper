// Re-implementation of Aider's SEARCH/REPLACE diff format patch application

export interface EditBlock {
  search: string;
  replace: string;
}

export function parseEditBlocks(llmResponse: string): EditBlock[] {
  const blocks: EditBlock[] = [];
  // Regex to extract <<<<<<< SEARCH ... ======= ... >>>>>>> REPLACE
  const regex = /<<<<<<< SEARCH\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> REPLACE/g;
  let match;
  while ((match = regex.exec(llmResponse)) !== null) {
    blocks.push({
      search: match[1],
      replace: match[2]
    });
  }
  return blocks;
}

export function applyEditBlocks(fileContent: string, blocks: EditBlock[]): string {
  let newContent = fileContent;
  for (const block of blocks) {
    if (newContent.includes(block.search)) {
      newContent = newContent.replace(block.search, block.replace);
    } else {
      console.warn('Could not find SEARCH block exactly. Fuzzy matching not yet implemented.');
    }
  }
  return newContent;
}
