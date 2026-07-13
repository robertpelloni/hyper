import {createStore, applyMiddleware} from 'redux';
import _thunk from 'redux-thunk';
import type {ThunkMiddleware} from 'redux-thunk';

import type {TormentNexusState, TormentNexusActions} from '../../typings/tormentnexus';
import rootReducer from '../reducers/index';
import effects from '../utils/effects';
import * as plugins from '../utils/plugins';

import writeMiddleware from './write-middleware';

const thunk: ThunkMiddleware<TormentNexusState, TormentNexusActions> = _thunk;

const configureStoreForProd = () =>
  createStore(rootReducer, applyMiddleware(thunk, plugins.middleware, thunk, writeMiddleware, effects));

export default configureStoreForProd;
