import * as actions from './actions';
import { types, util } from 'vortex-api';


const apiLimitReducer: types.IReducerSpec = {
    reducers: {
        [actions.setPluginLimits as any]: 
            (state, payload) => util.setSafe(state, [], payload.limits)
    },
    defaults: {}
}

export { apiLimitReducer };