// Native
import path from 'path';

// Packages
import test from 'ava';
import fs from 'fs-extra';
import {_electron} from 'playwright';
import type {ElectronApplication} from 'playwright';

let app: ElectronApplication;

test.before(async () => {
  let pathToBinary;

  switch (process.platform) {
    case 'linux':
      pathToBinary = path.join(__dirname, '../dist/linux-unpacked/tormentnexus');
      if (!fs.existsSync(pathToBinary)) {
        pathToBinary = path.join(__dirname, '../dist/linux-unpacked/TormentNexus');
      }
      break;

    case 'darwin':
      pathToBinary = path.join(__dirname, '../dist/mac/TormentNexus.app/Contents/MacOS/TormentNexus');
      if (!fs.existsSync(pathToBinary)) {
        pathToBinary = path.join(__dirname, '../dist/mac/TormentNexus.app/Contents/MacOS/tormentnexus');
      }
      break;

    case 'win32':
      pathToBinary = path.join(__dirname, '../dist/win-unpacked/TormentNexus.exe');
      if (!fs.existsSync(pathToBinary)) {
        pathToBinary = path.join(__dirname, '../dist/win-unpacked/tormentnexus.exe');
      }
      break;

    default:
      throw new Error('Path to the built binary needs to be defined for this platform in test/index.js');
  }

  app = await _electron.launch({
    executablePath: pathToBinary
  });
  await app.firstWindow();
  // Wait longer for Go Core to start
  await new Promise((resolve) => setTimeout(resolve, 10000));
});

test.after(async () => {
  if (app) {
    await app
      .evaluate(({BrowserWindow}) =>
        BrowserWindow.getFocusedWindow()
          ?.capturePage()
          .then((img) => img.toPNG().toString('base64'))
      )
      .then((img) => Buffer.from(img || '', 'base64'))
      .then(async (imageBuffer) => {
        await fs.mkdirp('dist/tmp');
        await fs.writeFile(`dist/tmp/${process.platform}_test.png`, imageBuffer);
      })
      .catch(() => {});
    await app.close();
  }
});

test('see if dev tools are open', async (t) => {
  t.false(await app.evaluate(({webContents}) => !!webContents.getFocusedWebContents()?.isDevToolsOpened()));
});

test('check go core connectivity', async (t) => {
  const isGoCoreRunning = await app.evaluate(async ({net}) => {
    return new Promise((resolve) => {
      const request = net.request('http://localhost:9876/mcp/servers');
      request.on('response', (response) => {
        resolve(response.statusCode === 200);
      });
      request.on('error', () => {
        resolve(false);
      });
      request.end();
    });
  });
  t.true(isGoCoreRunning);
});

test('trigger agent health check via RPC', async (t) => {
  const result = await app.evaluate(async ({BrowserWindow}) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return 'No window found';
    win.rpc.emit('agent check req');
    return 'Triggered';
  });
  t.is(result, 'Triggered');

  // Wait for notification to appear in the UI
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const screenshot = await app.evaluate(async ({BrowserWindow}) => {
    const win = BrowserWindow.getAllWindows()[0];
    return win.capturePage().then((img) => img.toPNG().toString('base64'));
  });
  t.truthy(screenshot);
});
