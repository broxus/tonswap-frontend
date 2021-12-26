import * as React from 'react'
import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { TvlChange } from '@/components/common/TvlChange'
import { TokenIcons } from '@/components/common/TokenIcons'
import { FarmingPair } from '@/modules/Farming/components/FarmingPair'
import {
    concatSymbols, formattedAmount, getChangesDirection,
    parseCurrencyBillions,
} from '@/utils'

import './index.scss'

type Token = {
    address: string;
    name?: string;
    uri?: string;
}

export type FarmingTableItemProps = {
    leftToken: Token;
    rightToken?: Token;
    rewardsIcons: Token[];
    tvl: string | null;
    tvlChange: string | null;
    apr: string | null;
    aprChange: string | null;
    share: string;
    vestedRewards: string[];
    entitledRewards: string[];
    startTime: number;
    endTime?: number;
    isOwner?: boolean;
    isPublic?: boolean;
    balanceWarning?: boolean;
    link?: string;
    rewardsLoading?: boolean;
}

export function FarmingTableItem({
    leftToken,
    rightToken,
    rewardsIcons,
    tvl,
    tvlChange,
    apr,
    aprChange,
    share,
    vestedRewards,
    entitledRewards,
    startTime,
    endTime,
    isOwner,
    isPublic,
    balanceWarning,
    link,
    rewardsLoading,
}: FarmingTableItemProps): JSX.Element {
    const Tag = (link ? Link : 'div') as React.ElementType
    const intl = useIntl()
    const nullMessage = intl.formatMessage({
        id: 'FARMING_TABLE_NULL',
    })
    const shareFormatted = intl.formatMessage({
        id: 'FARMING_TABLE_SHARE_VALUE',
    }, {
        value: formattedAmount(share, 0),
    })
    const aprFormatted = apr ? intl.formatMessage({
        id: 'FARMING_TABLE_APR_VALUE',
    }, {
        value: formattedAmount(apr, 0),
    }) : undefined
    const tvlFormatted = tvl ? parseCurrencyBillions(tvl) : undefined

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
                    limit={1}
                    icons={rewardsIcons}
                    title={intl.formatMessage({ id: 'FARMING_TABLE_REWARDS_TITLE' })}
                />
            </div>
            <div
                className="list__cell list__cell--left list__cell--right"
                title={tvlFormatted}
            >
                {tvl === null ? nullMessage : tvlFormatted}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {tvlChange === null ? nullMessage : (
                    <TvlChange
                        changesDirection={getChangesDirection(tvlChange)}
                        priceChange={tvlChange}
                    />
                )}
            </div>
            <div
                className="list__cell list__cell--left list__cell--right"
                title={aprFormatted}
            >
                {apr === null ? nullMessage : aprFormatted}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {aprChange === null ? nullMessage : (
                    <TvlChange
                        changesDirection={getChangesDirection(aprChange)}
                        priceChange={aprChange}
                    />
                )}
            </div>
            <div
                className="list__cell list__cell--left list__cell--right"
                title={shareFormatted}
            >
                {shareFormatted}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {rewardsLoading ? (
                    <Icon icon="loader" ratio={0.6} className="spin farming-table__loading" />
                ) : (
                    vestedRewards.map(item => (
                        <div>{item}</div>
                    ))
                )}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {rewardsLoading ? (
                    <Icon icon="loader" ratio={0.6} className="spin farming-table__loading" />
                ) : (
                    entitledRewards.map(item => (
                        <div>{item}</div>
                    ))
                )}
            </div>
        </Tag>
    )
}
