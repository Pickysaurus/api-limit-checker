import { createAction } from 'redux-act';
import { IAPILimitResponse } from './util';

export const setPluginLimits = createAction('SET_API_LIMITS', 
    (limits: IAPILimitResponse | Partial<IAPILimitResponse>) => ({ limits }));