import {INIT} from '../../typings/constants';
import type {TormentNexusDispatch} from '../../typings/tormentnexus';
import rpc from '../rpc';

export default function init() {
  return (dispatch: TormentNexusDispatch) => {
    dispatch({
      type: INIT,
      effect: () => {
        rpc.emit('init', null);
      }
    });
  };
}
