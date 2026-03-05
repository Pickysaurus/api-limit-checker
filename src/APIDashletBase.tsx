import * as React from 'react';
import { getRelativeTime, IAPILimitResponse, getLimits } from './util';
import { useSelector } from 'react-redux';
import { MainContext, types, util, log, Icon } from 'vortex-api';
import Progress from './Progess';
import { TFunction } from 'vortex-api/lib/util/i18n';

const helpUrl = 'https://help.nexusmods.com/article/105-i-have-reached-a-daily-or-hourly-limit-api-requests-have-been-consumed-rate-limit-exceeded-what-does-this-mean'

interface IAPIDashletProps {
    t: TFunction;
    onRefresh: (newTime?: Date) => void;
}

const dateOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit', 
    minute: '2-digit', 
    hourCycle: 'h23'
}

function APIDashletBase(props: IAPIDashletProps) {
    const { t, onRefresh } = props;
    const context = React.useContext(MainContext);
    const limits: IAPILimitResponse | null = useSelector((state: types.IState) => Object.keys((state.session as any).apiLimits).length ? (state.session as any).apiLimits : null);
    const lang = useSelector((state: types.IState) => state.settings?.interface?.language ?? 'en-GB');
    const login = useSelector((state: types.IState) => (state.persistent as any).nexus?.userInfo ?? null);
    const token = useSelector((state: types.IState) => (state.confidential.account as any).nexus?.OAuthCredentials?.token ?? null);
    const [error, setError] = React.useState<Error | null>(null);
    const [refreshTimer, setRefreshTimer] = React.useState<NodeJS.Timeout | null>(null);

    // On mounting the component
    React.useEffect(() => {
        // Set a 10min interval to update the display
        const interval = setInterval(() => {
            getLimits(context.api, token).catch(err => setError(err));
            onRefresh(new Date());
        }, 600000); 

        // Do the initial update
        if (!limits && !error) {
            getLimits(context.api, token).catch(err => setError(err));
        }

        // Clear the internal on unmount
        return () => clearInterval(interval);
    }, []);

    // On login state changed
    React.useEffect(() => {
        setError(null)
        getLimits(context.api, token).catch(err => setError(err));
    }, [login, token, context.api]);

    const onClickRefresh = () => {
        setError(null);
        const onTimeUp = () => {
            getLimits(context.api, token).catch(err => setError(err));
            setRefreshTimer(null)
            onRefresh(new Date())
        }; 
        const timer = setTimeout(onTimeUp, 500)
        setRefreshTimer(timer)
         
    }

    const remainingBar = React.useCallback((stats: { remaining: number, limit: number, resetAt: Date }) => (
        <div>
            <h4 style={{margin: 0}}>
                Available Requests
            </h4>
            <Progress max={stats?.limit ?? 10000} min={0} now={stats?.remaining ?? 10000} />
            <div title={stats.resetAt?.toLocaleDateString?.(lang, dateOptions) ?? 'Unknown'}>
                Resets {stats ? getRelativeTime(stats?.resetAt) : '???'}.
            </div>
        </div>
    ), [limits]);

    if (!login) {
        return <i>{t('Log in to Nexus Mods to view your API limits')}.</i>
    }

    const dailyLimitReached = !!limits && limits.daily?.remaining === 0 && limits.hourly?.remaining > 0;
    const allRequestsConsumed = !!limits && limits.daily?.remaining === 0 && limits.hourly?.remaining === 0;

    const dailyReset = limits?.daily?.resetAt?.toLocaleDateString?.(lang, dateOptions) ?? 'Unknown';
    const dailyResetRelative = getRelativeTime(limits?.daily?.resetAt);

    const openHelpPage = () => util.opn(helpUrl).catch((e: Error) => log('error', 'Error opening help page', e))

    return (
        <div>
            <div className='dashlet-title'>API Rate Limit</div>
            <button 
            className='issues-refresh icon-button icon-button-horizontal btn btn-default'
            onClick={onClickRefresh}
            disabled={!!refreshTimer}
            >
                <Icon name='refresh' />
            </button>
            <div>
                {(dailyLimitReached || allRequestsConsumed) &&(
                    <div 
                        style={{
                            display: 'flex', 
                            flexDirection: 'row', 
                            backgroundColor: allRequestsConsumed ? 'var(--brand-danger)' : 'var(--brand-warning)', 
                            color: allRequestsConsumed ? '#f4f4f5' : '#09090b',  
                            borderRadius: '4px', 
                            fontWeight: 500, 
                            margin: 0, 
                            padding: '4px 8px', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                        }}
                    >
                        <p style={{margin: 0}}>
                            {dailyLimitReached && t('Daily limit reached. Reset ')}
                            {allRequestsConsumed && t('No requests available. Full reset ')}
                            <span title={dailyReset}>{dailyResetRelative}</span>.
                        </p>
                        <a onClick={openHelpPage} style={{backgroundColor: '#f4f4f5', color: '#09090b', padding: '2px 4px', borderRadius: '4px'}}>
                            More
                        </a>
                    </div>)}
                {limits && remainingBar(limits?.daily.remaining > 0 ? limits.daily : limits?.hourly)}
            </div>
        </div>
    );
}

function propsAreEqual(prev: IAPIDashletProps, next: IAPIDashletProps): boolean {
    return prev.t === next.t;
}

export default React.memo(APIDashletBase, propsAreEqual);