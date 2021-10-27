import * as React from 'react'
import { Link } from 'react-router-dom'

import { CustomToken } from '@/misc'
import { formattedAmount, sliceAddress } from '@/utils'


type Props = {
    token: CustomToken;
}

export function Item({ token }: Props): JSX.Element {
    return (
        <Link to={`/builder/${token.root}`} className="list__row list__row--pointer">
            <div className="list__cell list__cell--left">
                {token.name}
            </div>
            <div className="list__cell list__cell--center">
                {token.symbol}
            </div>
            <div className="list__cell list__cell--center">
                {token.decimals}
            </div>
            <div className="list__cell list__cell--center">
                {formattedAmount(token.total_supply, token.decimals)}
            </div>
            <div className="list__cell list__cell--center">
                {sliceAddress(token.root)}
            </div>
        </Link>
    )
}
