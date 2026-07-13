import {resolve, dirname} from 'path';

import {app} from 'electron';
import isDev from 'electron-is-dev';

let goCorePath: string;

if (isDev) {
  goCorePath = resolve(__dirname, '../../bin/tormentnexus');
} else {
  // In packaged apps, the binary is in the 'resources/bin' directory next to the executable
  goCorePath = resolve(dirname(app.getPath('exe')), 'resources/bin/tormentnexus');
}

export function startGoCore() {
  console.log('Starting TormentNexus Go Core from:', goCorePath);
  const goCore = require('child_process').spawn(goCorePath, [], {
    env: {...process.env, TORMENTNEXUS_PORT: '9876'},
    detached: true,
    stdio: 'ignore'
  });
  goCore.unref();
  return goCore;
}

export async function checkAgentHealth() {
  const got = (await import('got')).default;
  try {
    const response = await got.get('http://127.0.0.1:9876/mcp/servers', {timeout: {request: 1000}}).json();
    return {status: 'healthy', data: response};
  } catch (error) {
    return {status: 'unhealthy', error: String(error)};
  }
}

export async function interceptAgentCommand(command: string) {
  const got = (await import('got')).default;
  try {
    const response: any = await got
      .post('http://127.0.0.1:9876/agent/execute', {
        json: {command}
      })
      .json();
    return response.response;
  } catch (error) {
    throw new Error(`Agent execution failed: ${error}`);
  }
}
