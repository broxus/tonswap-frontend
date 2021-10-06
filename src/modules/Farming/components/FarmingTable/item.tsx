import * as React from 'react'
import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'

import { TvlChange } from '@/components/common/TvlChange'
import { TokenIcons } from '@/components/common/TokenIcons'
import { FarmingPair } from '@/modules/Farming/components/FarmingPair'
import { FarmingDate } from '@/modules/Farming/components/FarmingDate'
import {
    amountOrZero, concatSymbols, getChangesDirection,
    parseCurrencyBillions,
} from '@/utils'

import './index.scss'

type Token = {
    address: string
    name?: string
    uri?: string
}

export type FarmingTableItemProps = {
    leftToken: Token
    rightToken?: Token
    rewardsIcons: Token[]
    tvl: string
    tvlChange: string
    apr: string
    share: string
    rewards: string[]
    startTime: number
    endTime?: number
    isOwner?: boolean
    isPublic?: boolean
    balanceWarning?: boolean
    link?: string
}

export function FarmingTableItem({
    leftToken,
    rightToken,
    rewardsIcons,
    tvl,
    tvlChange,
    apr,
    share,
    rewards,
    startTime,
    endTime,
    isOwner,
    isPublic,
    balanceWarning,
    link,
}: FarmingTableItemProps): JSX.Element {
    const Tag = (link ? Link : 'div') as React.ElementType
    const intl = useIntl()

    return (
        <Tag className="list__row" to={link}>
            <div className="list__cell list__cell--left">
                <FarmingPair
                    startTime={startTime}
                    endTime={endTime}
                    pairIcons={{ leftToken, rightToken }}
                    pairLabel={concatSymbols(leftToken.name, rightToken?.name)}
                    isOwner={isOwner}
                    isPublic={isPublic}
                    balanceWarning={balanceWarning}
                />
            </div>
            <div className="list__cell list__cell--left">
                <TokenIcons
                    limit={3}
                    icons={rewardsIcons}
                    title={intl.formatMessage({ id: 'FARMING_TABLE_REWARDS_TITLE' })}
                />
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
                {intl.formatMessage({
                    id: 'FARMING_TABLE_APR_VALUE',
                }, {
                    value: amountOrZero(apr, 0),
                })}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {intl.formatMessage({
                    id: 'FARMING_TABLE_SHARE_VALUE',
                }, {
                    value: amountOrZero(share, 0),
                })}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {rewards.map(value => (
                    <div key={value}>{value}</div>
                ))}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                <FarmingDate
                    startTime={startTime}
                    endTime={endTime}
                />
            </div>
        </Tag>
    )
}
