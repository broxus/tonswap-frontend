import * as React from 'react'
import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'

import { TvlChange } from '@/components/common/TvlChange'
import { TokenIcons } from '@/components/common/TokenIcons'
import { FarmingPair } from '@/modules/Farming/components/FarmingPair'
import {
    amountOrZero, concatSymbols, getChangesDirection,
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
}: FarmingTableItemProps): JSX.Element {
    const Tag = (link ? Link : 'div') as React.ElementType
    const intl = useIntl()
    const nullMessage = intl.formatMessage({
        id: 'FARMING_TABLE_NULL',
    })

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
                    limit={2}
                    icons={rewardsIcons}
                    title={intl.formatMessage({ id: 'FARMING_TABLE_REWARDS_TITLE' })}
                />
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {tvl === null ? nullMessage : parseCurrencyBillions(tvl)}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {tvlChange === null ? nullMessage : (
                    <TvlChange
                        changesDirection={getChangesDirection(tvlChange)}
                        priceChange={tvlChange}
                    />
                )}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {apr === null ? nullMessage : intl.formatMessage({
                    id: 'FARMING_TABLE_APR_VALUE',
                }, {
                    value: amountOrZero(apr, 0),
                })}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {aprChange === null ? nullMessage : (
                    <TvlChange
                        changesDirection={getChangesDirection(aprChange)}
                        priceChange={aprChange}
                    />
                )}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {intl.formatMessage({
                    id: 'FARMING_TABLE_SHARE_VALUE',
                }, {
                    value: amountOrZero(share, 0),
                })}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {vestedRewards.map(value => (
                    <div key={value}>{value}</div>
                ))}
            </div>
            <div className="list__cell list__cell--left list__cell--right">
                {entitledRewards.map(value => (
                    <div key={value}>{value}</div>
                ))}
            </div>
        </Tag>
    )
}
