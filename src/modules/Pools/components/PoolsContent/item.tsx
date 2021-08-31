import * as React from 'react'
import { Link } from 'react-router-dom'

import { Pair, PairProps } from '@/components/common/Pair'

export type ItemProps = {
    pair: PairProps
    lpTokens: string
    leftToken: string
    rightToken: string
    link: string
}

export function Item({
    pair,
    lpTokens,
    leftToken,
    rightToken,
    link,
}: ItemProps): JSX.Element {
    return (
        <Link className="list__row" to={link}>
            <div className="list__cell">
                <Pair {...pair} />
            </div>
            <div className="list__cell list__cell--right">{lpTokens}</div>
            <div className="list__cell list__cell--right">{leftToken}</div>
            <div className="list__cell list__cell--right">{rightToken}</div>
        </Link>
    )
}
