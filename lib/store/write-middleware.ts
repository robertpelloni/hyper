import type {Dispatch, Middleware} from 'redux';

import type {TormentNexusActions, TormentNexusState} from '../../typings/TormentNexus';
import terms from '../terms';

// the only side effect we perform from middleware
// is to write to the react term instance directly
// to avoid a performance hit
const writeMiddleware: Middleware<{}, TormentNexusState, Dispatch<TormentNexusActions>> = () => (next) => (action: TormentNexusActions) => {
  if (action.type === 'SESSION_PTY_DATA') {
    const term = terms[action.uid];
    if (term) {
      term.term.write(action.data);
    }
  }
  next(action);
};

export default writeMiddleware;
