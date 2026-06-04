import type {configOptions} from '../../typings/config';
import {CONFIG_LOAD, CONFIG_RELOAD} from '../../typings/constants/config';
import type {TormentNexusActions} from '../../typings/TormentNexus';

export function loadConfig(config: configOptions): TormentNexusActions {
  return {
    type: CONFIG_LOAD,
    config
  };
}

export function reloadConfig(config: configOptions): TormentNexusActions {
  const now = Date.now();
  return {
    type: CONFIG_RELOAD,
    config,
    now
  };
}
