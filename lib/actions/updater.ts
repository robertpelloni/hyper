import {UPDATE_INSTALL, UPDATE_AVAILABLE} from '../../typings/constants/updater';
import type {TormentNexusActions} from '../../typings/TormentNexus';
import rpc from '../rpc';

export function installUpdate(): TormentNexusActions {
  return {
    type: UPDATE_INSTALL,
    effect: () => {
      rpc.emit('quit and install');
    }
  };
}

export function updateAvailable(version: string, notes: string, releaseUrl: string, canInstall: boolean): TormentNexusActions {
  return {
    type: UPDATE_AVAILABLE,
    version,
    notes,
    releaseUrl,
    canInstall
  };
}
