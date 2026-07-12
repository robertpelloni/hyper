export async function executeAgentCommand(command: string) {
  const response = await fetch('http://localhost:9876/agent/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
  });
  if (!response.ok) {
    throw new Error(`Go Core error: ${response.statusText}`);
  }
  return response.json();
}

export async function listMcpServers() {
  const response = await fetch('http://localhost:9876/mcp/servers');
  if (!response.ok) {
    throw new Error(`Go Core error: ${response.statusText}`);
  }
  return response.json();
}
