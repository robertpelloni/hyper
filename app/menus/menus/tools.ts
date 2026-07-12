import type {BrowserWindow, MenuItemConstructorOptions} from 'electron';

const toolsMenu = (
  commands: Record<string, string>,
  execCommand: (command: string, focusedWindow?: BrowserWindow) => void
): MenuItemConstructorOptions => {
  return {
    label: 'Tools',
    submenu: [
      {
        label: 'Update plugins',
        accelerator: commands['plugins:update'],
        click() {
          execCommand('plugins:update');
        }
      },
      {
        label: 'Install TormentNexus CLI command in PATH',
        click() {
          execCommand('cli:install');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Run Agent Health Check',
        click() {
          execCommand('agent:check');
        }
      },
      {
        type: 'separator'
      },
      ...(process.platform === 'win32'
        ? <MenuItemConstructorOptions[]>[
            {
              label: 'Add TormentNexus to system context menu',
              click() {
                execCommand('systemContextMenu:add');
              }
            },
            {
              label: 'Remove TormentNexus from system context menu',
              click() {
                execCommand('systemContextMenu:remove');
              }
            },
            {
              type: 'separator'
            }
          ]
        : [])
    ]
  };
};

export default toolsMenu;
