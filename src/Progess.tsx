import * as React from 'react';

interface IProgresProps {
    max: number
    now: number
    min?: number
}

export default function Progress(props: IProgresProps) {
    let { max, now, min } = props;

    if (!min) min = 0

    const percent: number = Math.floor((now - min) / (max - min) * 100);

    const colour = progessColour(percent)
    
    return (
        <div className='progressbar' title={`${now.toLocaleString()}/${max.toLocaleString()}`}>
            <div className='progressbar-container' style={{border: '1px var(--border-color) solid', borderRadius: '4px'}}>
                <div className='progressbar-track' style={{height: 'var(--font-size-base)', backgroundColor: 'var(--gray-lighter)'}}>
                    <div className='progressbar-progress' style={{width: `${percent}%`, backgroundColor: `var(${colour})`, height: 'var(--font-size-base)'}}></div>
                </div>
            </div>
            <div className='progressbar-percentage'>{percent}%</div>
        </div>
    )
}

function progessColour(percent: number): string {
    if (percent < 10) return '--brand-danger'
    else if (percent < 25) return '--brand-warning'
    else return '--brand-info'
}