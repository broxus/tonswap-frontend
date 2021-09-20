import * as React from 'react'
import classNames from 'classnames'

import './style.scss'

export type TvlChangeProps = {
    changesDirection: number
    priceChange: string
}

export function TvlChange({
    changesDirection,
    priceChange,
}: TvlChangeProps): JSX.Element {
    return (
        <div
            className={classNames('changes-direction', {
                'changes-direction-up': changesDirection > 0,
                'changes-direction-down': changesDirection < 0,
            })}
        >
            {priceChange}
            %
        </div>
    )
}
