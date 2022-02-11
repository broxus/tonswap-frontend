import * as React from 'react'
import BigNumber from 'bignumber.js'
import classNames from 'classnames'

import { formattedAmount } from '@/utils'

import './index.scss'


type RateChangeProps = {
    value: string;
    size?: 'sm';
    className?: string;
}

function getDirection(value: BigNumber.Value): number {
    const val = new BigNumber(value ?? 0)
    if (val.lt(0)) {
        return -1
    }
    if (val.gt(0)) {
        return 1
    }
    return 0
}


export function RateChange({
    value,
    size,
    className,
}: RateChangeProps): JSX.Element {
    const dir = getDirection(value)
    return (
        <div
            className={classNames('rate-change', className, {
                'rate-change-up': dir > 0,
                'rate-change-down': dir < 0,
                [`rate-change-${size}`]: size !== undefined,
            })}
        >
            {formattedAmount(value, undefined, { preserve: true })}
            %
        </div>
    )
}
