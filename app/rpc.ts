import {EventEmitter} from 'events';

import {ipcMain} from 'electron';
import type {BrowserWindow, IpcMainEvent} from 'electron';

import {v4 as uuidv4} from 'uuid';

import type {TypedEmitter, MainEvents, RendererEvents, FilterNever} from '../typings/common';

export class Server {
  emitter: TypedEmitter<MainEvents>;
  destroyed = false;
  win: BrowserWindow;
  id!: string;

  constructor(win: BrowserWindow) {
    this.emitter = new EventEmitter();
    this.win = win;
    this.emit = this.emit.bind(this);

    if (this.destroyed) {
      return;
    }

    const uid = uuidv4();
    this.id = uid;

    ipcMain.on(uid, this.ipcListener);

    // we intentionally subscribe to `on` instead of `once`
    // to support reloading the window and re-initializing
    // the channel
    this.wc.on('did-finish-load', () => {
      this.wc.send('init', uid, win.profileName);
    });
  }

  get wc() {
    return this.win.webContents;
  }

  ipcListener = <U extends keyof MainEvents>(event: IpcMainEvent, {ev, data}: {ev: U; data: MainEvents[U]}) =>
    this.emitter.emit(ev, data);

  on = <U extends keyof MainEvents>(ev: U, fn: (arg0: MainEvents[U]) => void) => {
    this.emitter.on(ev, fn);
    return this;
  };

  once = <U extends keyof MainEvents>(ev: U, fn: (arg0: MainEvents[U]) => void) => {
    this.emitter.once(ev, fn);
    return this;
  };

  emit<U extends Exclude<keyof RendererEvents, FilterNever<RendererEvents>>>(ch: U): boolean;
  emit<U extends FilterNever<RendererEvents>>(ch: U, data: RendererEvents[U]): boolean;
  emit<U extends keyof RendererEvents>(ch: U, data?: RendererEvents[U]) {
    // This check is needed because data-batching can cause extra data to be
    // emitted after the window has already closed
    if (!this.win.isDestroyed()) {
      this.wc.send(this.id, {ch, data});
      return true;
    }
    return false;
  }

  destroy() {
    this.emitter.removeAllListeners();
    this.wc.removeAllListeners();
    if (this.id) {
      ipcMain.removeListener(this.id, this.ipcListener);
    } else {
      // mark for `genUid` in constructor
      this.destroyed = true;
    }
  }
}

const createRPC = (win: BrowserWindow) => {
  return new Server(win);
};

export default createRPC;

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
