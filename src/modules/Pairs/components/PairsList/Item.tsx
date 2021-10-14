import * as React from 'react'
import { Link } from 'react-router-dom'

import { TogglePoolButton } from '@/modules/Pools/components/TogglePoolButton'
import { PairIcons } from '@/modules/Pairs/components/PairIcons'
import { PairInfo } from '@/modules/Pairs/types'
import { useTokensCache } from '@/stores/TokensCacheService'
import { parseCurrencyBillions } from '@/utils'


type Props = {
    pair: PairInfo;
    idx?: number;
}


export function Item({ pair, idx }: Props): JSX.Element {
    const tokensCache = useTokensCache()

    const baseToken = React.useMemo(
        () => tokensCache.tokens.find(({ root }) => root === pair.meta.baseAddress),
        [],
    )
    const counterToken = React.useMemo(
        () => tokensCache.tokens.find(({ root }) => root === pair.meta.counterAddress),
        [],
    )

    const volume24h = React.useMemo(() => parseCurrencyBillions(pair.volume24h), [pair.volume24h])
    const volume7d = React.useMemo(() => parseCurrencyBillions(pair.volume7d), [pair.volume7d])
    const tvl = React.useMemo(() => parseCurrencyBillions(pair.tvl), [pair.tvl])

    return (
        <Link to={`/pairs/${pair.meta.poolAddress}`} className="list__row">
            <div className="list__cell hide-540">{idx}</div>
            <div className="list__cell">
                <div className="list__cell-inner">
                    <div className="pairs-list__token-fave-wrapper">
                        <TogglePoolButton
                            poolAddress={pair.meta.poolAddress}
                            leftSymbol={baseToken?.symbol}
                            rightSymbol={counterToken?.symbol}
                            iconRatio={0.8}
                        />
                    </div>
                    <div className="pairs-list__token-icons-wrapper">
                        <PairIcons
                            leftToken={baseToken}
                            rightToken={counterToken}
                            small
                        />
                    </div>
                    <div>
                        <h3 className="pairs-list__token-name">
                            {baseToken?.symbol || pair.meta.base}
                            /
                            {counterToken?.symbol || pair.meta.counter}
                        </h3>
                    </div>
                </div>
            </div>
            <div className="list__cell list__cell--right">
                {volume24h}
            </div>
            <div className="list__cell list__cell--right hide-824">
                {volume7d}
            </div>
            <div className="list__cell list__cell--right hide-540">
                {tvl}
            </div>
        </Link>
    )
}
