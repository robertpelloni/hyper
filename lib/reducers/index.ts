import {combineReducers} from 'redux';
import type {Reducer} from 'redux';

import type {TormentNexusActions, TormentNexusState} from '../../typings/TormentNexus';

import sessions from './sessions';
import termGroups from './term-groups';
import ui from './ui';

export default combineReducers({
  ui,
  sessions,
  termGroups
}) as Reducer<TormentNexusState, TormentNexusActions>;
