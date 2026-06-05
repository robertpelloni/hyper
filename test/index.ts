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
      pathToBinary = path.join(__dirname, '../dist/linux-unpacked/TormentNexus');
      if (!fs.existsSync(pathToBinary)) {
        pathToBinary = path.join(__dirname, '../dist/linux-unpacked/tormentnexus');
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
  await new Promise((resolve) => setTimeout(resolve, 5000));
});

test.after(async () => {
  await app
    .evaluate(({BrowserWindow}) =>
      BrowserWindow.getFocusedWindow()
        ?.capturePage()
        .then((img) => img.toPNG().toString('base64'))
    )
    .then((img) => Buffer.from(img || '', 'base64'))
    .then(async (imageBuffer) => {
      await fs.writeFile(`dist/tmp/${process.platform}_test.png`, imageBuffer);
    });
  await app.close();
});

test('see if dev tools are open', async (t) => {
  t.false(await app.evaluate(({webContents}) => !!webContents.getFocusedWebContents()?.isDevToolsOpened()));
});

test('check go core connectivity', async (t) => {
  const isGoCoreRunning = await app.evaluate(async () => {
    try {
      const response = await fetch('http://localhost:9876/mcp/servers');
      return response.ok;
    } catch (e) {
      return false;
    }
  });
  t.true(isGoCoreRunning);
});
