import * as React from 'react';
import APIDashletBase from './APIDashletBase';
import LastUpdated from './LastUpdated';
import { TFunction } from 'vortex-api/lib/util/i18n';

interface IAPIDashletProps {
    // Props from Vortex
    counter: number;
    t: TFunction;
}

function APIDashlet(props: React.PropsWithChildren<IAPIDashletProps>) {
    const { t, counter } = props;
    const [updateTime, setUpdateTime] = React.useState<Date>(new Date());

    return (
        <div className='dashlet'>
            <APIDashletBase t={t} onRefresh={(newTime?: Date) => setUpdateTime(newTime || new Date())} />
            <LastUpdated time={updateTime} tick={counter} />
        </div>
    )
}

export default APIDashlet;