import {executeAgentCommand} from './agent-bridge';

export async function interceptAgentCommand(data: string, rpc: any, uid: string) {
  if (data.startsWith('/agent ')) {
    const command = data.slice(7).trim();
    try {
      const response = await executeAgentCommand(command);
      rpc.emit('session data', uid + '\r\nAGENT: ' + response.response + '\r\n');
      return true;
    } catch (e: any) {
      rpc.emit('session data', uid + '\r\nAGENT ERROR: ' + e.message + '\r\n');
      return true;
    }
  }
  return false;
}
