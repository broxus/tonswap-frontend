import * as React from 'react'
import { Link } from 'react-router-dom'

import { TokenIcon } from '@/components/common/TokenIcon'
import { TvlChange } from '@/components/common/TvlChange'
import { CurrencyInfo } from '@/modules/Currencies/types'
import { useTokensCache } from '@/stores/TokensCacheService'
import { getChangesDirection, parseCurrencyBillions } from '@/utils'


type Props = {
    currency: CurrencyInfo;
    idx?: number;
}


export function Item({ currency, idx }: Props): JSX.Element {
    const tokensCache = useTokensCache()

    const token = React.useMemo(() => tokensCache.get(currency.address), [currency.address])

    const price = React.useMemo(() => parseCurrencyBillions(currency.price), [currency.price])
    const volume24h = React.useMemo(() => parseCurrencyBillions(currency.volume24h), [currency.volume24h])
    const tvl = React.useMemo(() => parseCurrencyBillions(currency.tvl), [currency.tvl])

    return (
        <Link to={`/tokens/${currency.address}`} className="list__row">
            <div className="list__cell hide-540">{idx}</div>
            <div className="list__cell">
                <div className="list__cell-inner">
                    <div className="currencies-list__token-icon-wrapper">
                        <TokenIcon
                            address={currency.address}
                            className="currencies-list__token-icon"
                            name={token?.symbol}
                            size="small"
                            uri={token?.icon}
                        />
                    </div>
                    <div>
                        <h3 className="currencies-list__token-name">
                            {token?.symbol || currency.currency}
                        </h3>
                        <div className="currencies-list__token-subname">
                            {token?.name}
                        </div>
                    </div>
                </div>
            </div>
            <div className="list__cell list__cell--right hide-540">
                {price}
            </div>
            <div className="list__cell list__cell--right hide-824">
                <TvlChange
                    changesDirection={getChangesDirection(currency.priceChange)}
                    priceChange={currency.priceChange}
                />
            </div>
            <div className="list__cell list__cell--right">
                {volume24h}
            </div>
            <div className="list__cell list__cell--right hide-824">
                {tvl}
            </div>
        </Link>
    )
}
