import * as React from 'react'

import { Token } from '@/modules/Builder/types'


type Props = {
    token: Token
}

export function Item({ token }: Props): JSX.Element {
    return (
        <>
            <div className="token-list__row">
                <div className="token-list__cell token-list__cell--center">
                    {token.name}
                </div>
                <div className="token-list__cell token-list__cell--center">
                    {token.symbol}
                </div>
                <div className="token-list__cell token-list__cell--center">
                    {token.decimals}
                </div>
                <div className="token-list__cell token-list__cell--center">
                    {token.total_supply}
                </div>
            </div>
        </>
    )
}
