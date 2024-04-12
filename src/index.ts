import { types, log } from 'vortex-api';
import APIDashlet from './APIDashlet';
import { checkLimits} from './util';
import { apiLimitReducer } from './reducers';

function main(context: types.IExtensionContext) {
    context.registerAction('global-icons', 300, 'settings', {}, 'Check API Limits', () => {checkLimits(context.api)});
    context.registerDashlet(
      'API Limits', 
      1, 2, 0, 
      APIDashlet, 
      () => true, 
      () => {}, 
      { closable: true });

    context.registerReducer(['session', 'apiLimits'], apiLimitReducer);
    return true;
}

export default main;