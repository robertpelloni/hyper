import {net} from 'electron';

export function executeAgentCommand(command: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: 'POST',
      url: 'http://localhost:9876/agent/execute'
    });
    request.setHeader('Content-Type', 'application/json');
    request.on('response', (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    request.on('error', (error) => {
      reject(error);
    });
    request.write(JSON.stringify({command}));
    request.end();
  });
}
