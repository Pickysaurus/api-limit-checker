import { types, log } from 'vortex-api';
import { setPluginLimits } from './actions';

const validateURL = 'https://api.nexusmods.com/v1/games.json'; 

export interface IAPILimitResponse {
    daily: {
        remaining: number;
        limit: number;
        resetAt: Date;
    }
    hourly: {
        remaining: number;
        limit: number;
        resetAt: Date;
    }
}

export async function checkLimits(api: types.IExtensionApi): Promise<null> {
    const state = api.getState();
    const OAuthCredentials = (state.confidential.account as any)?.nexus?.OAuthCredentials;
    const token = OAuthCredentials.token;
  
    try {
      const limits = await getLimits(api, token);
      const message = `Daily: ${limits.daily.remaining}/${limits.daily.limit} | Resets ${getRelativeTime(limits.daily.resetAt)}\n`+
      `Hourly: ${limits.hourly.remaining}/${limits.hourly.limit} | Resets ${getRelativeTime(limits.hourly.resetAt)}`;
      
      api.sendNotification({ type: 'info', title: 'API Rate Limits', message, displayMS: 10000 });  
      return;
    }
    catch(err) {
      log('error', 'Failed to update API limits', err);
      api.sendNotification({ type: 'error', title: 'Failed to get API Rate Limits', message: err.message, displayMS: 10000 });
      return;
    }
  }

export async function getLimits(api: types.IExtensionApi, token: string | undefined): Promise<IAPILimitResponse> {
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
        if (!token) throw new Error('Not authorised');
        const response = await fetch(validateURL, { method: 'GET', headers });
        if (response.ok) {
          const hourlyLimit = response.headers.get('X-RL-Hourly-Limit');
          const hourlyRemaining = response.headers.get('X-RL-Hourly-Remaining');
          const hourlyReset = response.headers.get('X-RL-Hourly-Reset');
          const dailyLimit = response.headers.get('X-RL-Daily-Limit');
          const dailyRemaining = response.headers.get('X-RL-Daily-Remaining');
          const dailyReset = response.headers.get('X-RL-Daily-Reset');

          const result = {
            daily: {
                remaining: parseInt(dailyRemaining),
                limit: parseInt(dailyLimit),
                resetAt: new Date(dailyReset)
            },
            hourly: {
                remaining: parseInt(hourlyRemaining),
                limit: parseInt(hourlyLimit),
                resetAt: new Date(hourlyReset)
            }
        }

        api.store.dispatch(setPluginLimits(result));
        log('debug', 'Rate limits fetched from the API', { result })


        return result;

        }
        else if (response.status === 429) {
          // Fully rate limited

          const now = new Date()
          const dailyReset = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          dailyReset.setUTCHours(0, 0, 0, 0)

          const hourlyReset = new Date(now.getTime() + 60 * 60 * 1000)
          hourlyReset.setUTCMinutes(0, 0, 0)


          const result = {
            daily: {
                remaining: 0,
                limit: 10000,
                resetAt: dailyReset
            },
            hourly: {
                remaining: 0,
                limit: 500,
                resetAt: hourlyReset
            }
          }

          api.store.dispatch(setPluginLimits(result));

          log('warn', 'Could not get API limits due to rate limiting, assuming 0')

          return result;
        }
        else throw new Error(`${response.status} - ${response.statusText ?? 'Unable to check API limits'}`);
    
      }
      catch(err) {
        log('error', 'Unexpected error getting API limits', err)
        api.store.dispatch(setPluginLimits({}));
        throw err;
      }
}
  
const units: {[unit: Intl.RelativeTimeFormatUnit | string]: number} = {
    year  : 24 * 60 * 60 * 1000 * 365,
    month : 24 * 60 * 60 * 1000 * 365/12,
    day   : 24 * 60 * 60 * 1000,
    hour  : 60 * 60 * 1000,
    minute: 60 * 1000,
    // second: 1000
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  
export const getRelativeTime = (d1: Date, d2 = new Date()): string => {
    if (!d1) return null
    let elapsed = d1.getTime() - d2.getTime()

    // "Math.abs" accounts for both "past" & "future" scenarios
    for (const u in units) 
        if (Math.abs(elapsed) > units[u] || u == 'minute') {
          let unit = Math.round(elapsed/units[u])
          if (unit > -1 && u === 'minute') return 'less than a minute ago'
          else return rtf.format(Math.round(elapsed/units[u]), u as Intl.RelativeTimeFormatUnit)
        }}