import * as React from 'react'

import { TvlChange } from '@/components/common/TvlChange'
import { Pair } from '@/components/common/Pair'
import { TokenIcons } from '@/components/common/TokenIcons'
import { concatSymbols, getChangesDirection, parseCurrencyBillions } from '@/utils'

export type PoolFarmingsItemProps = {
    leftTokenAddress: string
    rightTokenAddress: string
    leftTokenUri?: string
    rightTokenUri?: string
    leftToken: string
    rightToken: string
    tvl: string
    tvlChange: string
    rewardsIcons: {
        address: string
        uri?: string
    }[]
    apr: string
    share: string
    rewards: string[]
    entitled: string[]
}

export function PoolFarmingsItem({
    leftTokenAddress,
    rightTokenAddress,
    leftTokenUri,
    rightTokenUri,
    leftToken,
    rightToken,
    rewardsIcons,
    tvl,
    tvlChange,
    apr,
    share,
    rewards,
    entitled,
}: PoolFarmingsItemProps): JSX.Element {
    return (
        <div className="list__row">
            <div className="list__cell list__cell--left">
                <Pair
                    pairIcons={{
                        leftToken: {
                            address: leftTokenAddress,
                            uri: leftTokenUri,
                        },
                        rightToken: {
                            address: rightTokenAddress,
                            uri: rightTokenUri,
                        },
                    }}
                    pairLabel={concatSymbols(leftToken, rightToken)}
                />
            </div>
            <div className="list__cell list__cell--left">
                <TokenIcons icons={rewardsIcons} />
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {parseCurrencyBillions(tvl)}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                <TvlChange
                    changesDirection={getChangesDirection(tvlChange)}
                    priceChange={tvlChange}
                />
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {apr}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {share}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {rewards.map(item => (
                    <div key={item}>{item}</div>
                ))}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {entitled.map(item => (
                    <div key={item}>{item}</div>
                ))}
            </div>
        </div>
    )
}
