import {interceptAgentCommand} from './agent-integration';

export async function runLatencyTest() {
  const start = Date.now();
  try {
    await interceptAgentCommand('status');
    const end = Date.now();
    console.log(`Electron-to-Go Latency: ${end - start}ms`);
    return end - start;
  } catch (error) {
    console.error('Latency test failed:', error);
    return -1;
  }
}
