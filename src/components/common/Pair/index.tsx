import * as React from 'react'
import classNames from 'classnames'

import { PairIcons, PairIconsProps } from '@/components/common/PairIcons'

import './style.scss'

export type PairProps = {
    pairIcons: PairIconsProps
    pairLabel: string
    status?: 'active' | 'no-active'
}

export function Pair({
    pairIcons,
    pairLabel,
    status,
}: PairProps): JSX.Element {
    return (
        <div
            className={classNames('pair', {
                pair_active: status === 'active',
                'pair_no-active': status === 'no-active',
            })}
        >
            <PairIcons small {...pairIcons} />
            {pairLabel}
        </div>
    )
}
