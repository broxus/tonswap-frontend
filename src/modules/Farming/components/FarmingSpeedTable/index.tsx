import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { DateTime } from 'luxon'

import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokensCache } from '@/stores/TokensCacheService'
import { amountOrZero } from '@/utils'

import './index.scss'

type Props = {
    rewardTokensRoots: string[];
    roundStartTimes: number[];
    roundRps: string[][];
    endTime: number;
}

// TODO: Pagination
export function FarmingSpeedTableInner({
    rewardTokensRoots,
    roundStartTimes,
    roundRps,
    endTime,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const rewardTokens = rewardTokensRoots.map(root => tokensCache.get(root))

    const formatDate = (time: number) => (
        DateTime.fromMillis(time).toFormat('MMM dd, yyyy, HH:mm')
    )

    return (
        <div className="card card--small card--flat">
            <div className="list farming-speed">
                <div className="list__header">
                    <div className="list__cell list__cell--left">
                        {intl.formatMessage({
                            id: 'FARMING_SPEED_TITLE',
                        })}
                    </div>
                    <div className="list__cell list__cell--right">
                        {intl.formatMessage({
                            id: 'FARMING_SPEED_START_TITLE',
                        })}
                    </div>
                    <div className="list__cell list__cell--right">
                        {intl.formatMessage({
                            id: 'FARMING_SPEED_END_TITLE',
                        })}
                    </div>
                </div>

                {roundRps.map((rps, index) => (
                    /* eslint-disable react/no-array-index-key */
                    <div className="list__row" key={index}>
                        <div className="list__cell list__cell--left">
                            {rewardTokens.map((token, idx) => (
                                token && (
                                    <div className="farming-speed__token" key={token.root}>
                                        <TokenIcon
                                            size="xsmall"
                                            uri={token.icon}
                                            address={token.root}
                                        />
                                        {intl.formatMessage({
                                            id: 'FARMING_TOKEN',
                                        }, {
                                            amount: amountOrZero(rps[idx], token.decimals),
                                            symbol: token.symbol,
                                        })}
                                    </div>
                                )
                            ))}
                        </div>
                        <div className="list__cell list__cell--right">
                            {roundStartTimes[index] ? formatDate(roundStartTimes[index]) : '—'}
                        </div>
                        <div className="list__cell list__cell--right">
                            {endTime > 0 && !roundStartTimes[index + 1] ? (
                                formatDate(endTime)
                            ) : (
                                <>
                                    {roundStartTimes[index + 1]
                                        ? formatDate(roundStartTimes[index + 1])
                                        : '—'}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export const FarmingSpeedTable = observer(FarmingSpeedTableInner)
