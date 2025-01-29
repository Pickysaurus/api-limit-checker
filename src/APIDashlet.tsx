import * as React from 'react';
import { getRelativeTime, IAPILimitResponse, getLimits } from './util';
import { useSelector } from 'react-redux';
import { MainContext, types, util, log, Icon } from 'vortex-api';
import Progress from './Progess';

const helpUrl = 'https://help.nexusmods.com/article/105-i-have-reached-a-daily-or-hourly-limit-api-requests-have-been-consumed-rate-limit-exceeded-what-does-this-mean'

interface IAPIDashletProps {
    // Props from Vortex
    counter: number;
    t: (input: string) => string;
}

const dateOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit', 
    minute: '2-digit', 
    hourCycle: 'h23'
}

export default function APIDashlet(props: IAPIDashletProps) {
    const { t } = props;
    const context = React.useContext(MainContext);
    const limits: IAPILimitResponse | null = useSelector((state: types.IState) => Object.keys((state.session as any).apiLimits).length ? (state.session as any).apiLimits : null);
    const lang = useSelector((state: types.IState) => state.settings?.interface?.language ?? 'en-GB');
    const login = useSelector((state: types.IState) => (state.persistent as any).nexus?.userInfo ?? null);
    const token = useSelector((state: types.IState) => (state.confidential.account as any).nexus?.OAuthCredentials?.token ?? null);
    const [error, setError] = React.useState<Error>()
    const [refreshTimer, setRefreshTimer] = React.useState<NodeJS.Timeout>();
    const [updateTime, setUpdateTime] = React.useState<Date>(new Date());

    // On mounting the component
    React.useEffect(() => {
        // Set a 10min interval to update the display
        const interval = setInterval(() => {
            getLimits(context.api, token).catch(err => setError(err));
            setUpdateTime(new Date());
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
    }, [login]);

    const onClickRefresh = () => {
        setError(null);
        const onTimeUp = () => {
            getLimits(context.api, token).catch(err => setError(err));
            setRefreshTimer(null)
            setUpdateTime(new Date())
        }; 
        const timer = setTimeout(onTimeUp, 500)
        setRefreshTimer(timer)
         
    }

    const remainingBar = (stats: { remaining: number, limit: number, resetAt: Date }) => (
        <div>
            <h4 style={{margin: 0}}>
                Available Requests
            </h4>
            <Progress max={stats?.limit ?? 10000} min={0} now={stats?.remaining ?? 10000} />
            <div title={stats.resetAt?.toLocaleDateString(lang, dateOptions) ?? 'Unknown'}>
                Resets {stats ? getRelativeTime(stats?.resetAt) : '???'}.
            </div>
        </div>
    );

    let content: JSX.Element = null

    if (!login) {
        content = <i>{t('Log in to Nexus Mods to view your API limits')}.</i>
    }

    if (!!limits && limits.daily?.remaining === 0 && limits.hourly?.remaining > 0) {
        content = (
        <div style={{display: 'flex', flexDirection: 'row', backgroundColor: 'var(--brand-warning)', color: '#09090b',  borderRadius: '4px', fontWeight: 500, margin: 0, padding: '4px 8px', justifyContent: 'space-between', alignItems: 'center'}}>
            <p style={{margin: 0}}>
                Daily limit reached. Reset <span title={limits.daily?.resetAt?.toLocaleDateString(lang, dateOptions) ?? 'Unknown'}>{limits.daily ? getRelativeTime(limits.daily.resetAt) : '???'}</span>.
            </p>
            <a onClick={() => util.opn(helpUrl).catch((e: Error) => log('error', 'Error opening help page', e))} style={{backgroundColor: '#f4f4f5', color: '#09090b', padding: '2px 4px', borderRadius: '4px'}}>
                More
            </a>
        </div>
        );
    }
    else if (!!limits && limits.daily?.remaining === 0 && limits.hourly?.remaining === 0) {
        content = (
        <div style={{display: 'flex', flexDirection: 'row', backgroundColor: 'var(--brand-danger)', color: '#f4f4f5',  borderRadius: '4px', fontWeight: 500, margin: 0, padding: '4px 8px', justifyContent: 'space-between', alignItems: 'center'}}>
            <p style={{margin: 0}}>
                No requests available. Full reset <span title={limits.daily?.resetAt?.toLocaleDateString(lang, dateOptions) ?? 'Unknown'}>{limits.daily ? getRelativeTime(limits.daily.resetAt) : '???'}</span>.
            </p>
            <a onClick={() => util.opn(helpUrl).catch((e: Error) => log('error', 'Error opening help page', e))} style={{backgroundColor: '#f4f4f5', color: '#09090b', padding: '2px 4px', borderRadius: '4px'}}>
                More
            </a>
        </div>
        );
    }

    if (!!limits) {
        content = (<>
            {content}
            {!!limits && limits.daily?.remaining > 0 
            ? remainingBar(limits.daily)
            : remainingBar(limits.hourly)}
        </>)
    }

    return (
        <div className='dashlet'>
            <div className='dashlet-title'>API Rate Limit</div>
            <button 
            className='issues-refresh icon-button icon-button-horizontal btn btn-default'
            onClick={onClickRefresh}
            disabled={!!refreshTimer}
            >
                <Icon name='refresh' />
            </button>
            {content}
            <span>Last update {updateTime ? getRelativeTime(updateTime) : '???'}.</span>
        </div>
    )
}
