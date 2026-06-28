#!/bin/bash
# Append ipcMain handle for command block creation
cat << 'APP_EOF' >> app/rpc.ts

import {ipcMain} from 'electron';

ipcMain.handle('rpc-create-command-block', async (event, {command, cwd}) => {
  // In a real implementation this would invoke the Go core via HTTP/WebSocket or PTY stream parsing
  // Here we return a mocked block conforming to the structure
  return {
    id: "uuid-" + Date.now(),
    command,
    stdout: "Executing: " + command,
    stderr: "",
    exitCode: 0,
    startTime: Date.now(),
    endTime: Date.now() + 100,
    cwd
  };
});

ipcMain.handle('rpc-get-ghost-suggestion', async (event, {input}) => {
  // Mock autocomplete handler
  if (input.startsWith('npm i')) {
    return 'nstall';
  }
  return '';
});
APP_EOF
