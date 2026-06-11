import {createSelector} from 'reselect';

import type {TormentNexusState} from '../typings/tormentnexus';

const getTermGroups = ({termGroups}: Pick<TormentNexusState, 'termGroups'>) => termGroups.termGroups;
export const getRootGroups = createSelector(getTermGroups, (termGroups) =>
  Object.keys(termGroups)
    .map((uid) => termGroups[uid])
    .filter(({parentUid}) => !parentUid)
);
