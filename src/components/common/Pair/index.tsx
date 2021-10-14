import * as React from 'react'

import { PairIcons, PairIconsProps } from '@/components/common/PairIcons'

import './style.scss'

export type PairProps = {
    pairIcons: PairIconsProps
    pairLabel: string
}

export function Pair({
    pairIcons,
    pairLabel,
}: PairProps): JSX.Element {
    return (
        <div className="pair">
            <PairIcons small {...pairIcons} />
            <span className="pair__label" title={pairLabel}>
                {pairLabel}
            </span>
        </div>
    )
}
