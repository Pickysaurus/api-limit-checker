import * as React from 'react';
import { getRelativeTime } from './util';

const LastUpdated = ({ time, tick }: { time: Date, tick: number }) => {
    return (<span title={String(tick)}>Last update {time ? getRelativeTime(time) : '???'}.</span>)
}

function propsAreEqual(prev: { time: Date, tick: number }, next: { time: Date, tick: number }): boolean {
    const tickDiff = Math.abs(next.tick - prev.tick);
    
    // 1. If the reference to 'time' changed (e.g. setUpdateTime was called), we MUST render.
    // 2. Otherwise, only render if 30 seconds have passed.
    
    const timeChanged = prev.time !== next.time;
    const shouldSkip = !timeChanged && tickDiff < 30;

    // console.log('Last Updated check', { tickDiff, timeChanged, skipping: shouldSkip });
    
    return shouldSkip; 
}

export default React.memo(LastUpdated, propsAreEqual);