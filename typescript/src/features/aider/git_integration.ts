// Re-implementation of Aider's automated Git commit flow

import {spawnSync} from 'child_process';

export function autoCommit(message: string): boolean {
  try {
    const addResult = spawnSync('git', ['add', '.']);
    if (addResult.status !== 0) {
      console.error('Git add failed', addResult.stderr?.toString());
      return false;
    }

    const commitResult = spawnSync('git', ['commit', '-m', message]);
    if (commitResult.status !== 0) {
      console.error('Git commit failed', commitResult.stderr?.toString());
      return false;
    }

    return true;
  } catch (e) {
    console.error('Auto-commit failed', e);
    return false;
  }
}
