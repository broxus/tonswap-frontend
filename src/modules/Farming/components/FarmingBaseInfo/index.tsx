import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokensCache } from '@/stores/TokensCacheService'
import { amountOrZero, parseCurrencyBillions, shareAmount } from '@/utils'

import './index.scss'

type Props = {
    tvl: string;
    apr: string;
    rpsAmount: string[];
    lpTokenAmount: string;
    lpTokenDecimal: number;
    lpTokenSymbol: string;
    rewardTokensRoot: string[];
    rewardTokensAmount: string[];
    leftTokenRoot?: string;
    rightTokenRoot?: string;
    pairBalanceLeft?: string;
    pairBalanceRight?: string;
    pairBalanceLp?: string;
}

function FarmingBaseInfoInner({
    tvl,
    apr,
    rewardTokensRoot,
    rewardTokensAmount,
    rpsAmount,
    lpTokenAmount,
    lpTokenDecimal,
    lpTokenSymbol,
    leftTokenRoot,
    rightTokenRoot,
    pairBalanceLeft,
    pairBalanceRight,
    pairBalanceLp,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const rewardTokens = rewardTokensRoot.map(root => tokensCache.get(root))
    const leftToken = leftTokenRoot && tokensCache.get(leftTokenRoot)
    const rightToken = rightTokenRoot && tokensCache.get(rightTokenRoot)

    return (
        <div className="farming-base-info">
            <div className="farming-panel farming-panel_compact">
                <div className="farming-panel__rows">
                    <div>
                        <div className="farming-panel__label">
                            {intl.formatMessage({
                                id: 'FARMING_BASE_INFO_TVL',
                            })}
                        </div>
                        <div className="farming-panel__value">
                            {parseCurrencyBillions(tvl)}
                        </div>
                    </div>

                    {
                        leftToken
                        && rightToken
                        && pairBalanceLeft
                        && pairBalanceRight
                        && pairBalanceLp
                        && (
                            <div>
                                <div className="farming-panel__label">
                                    {intl.formatMessage({
                                        id: 'FARMING_BASE_INFO_TOKENS',
                                    })}
                                </div>
                                <div className="farming-panel__token">
                                    <TokenIcon
                                        size="xsmall"
                                        uri={leftToken.icon}
                                        address={leftToken.root}
                                    />
                                    {intl.formatMessage({
                                        id: 'FARMING_TOKEN',
                                    }, {
                                        amount: shareAmount(
                                            lpTokenAmount,
                                            pairBalanceLeft,
                                            pairBalanceLp,
                                            leftToken.decimals,
                                        ),
                                        symbol: leftToken.symbol,
                                    })}
                                </div>
                                <div className="farming-panel__token">
                                    <TokenIcon
                                        size="xsmall"
                                        uri={rightToken.icon}
                                        address={rightToken.root}
                                    />
                                    {intl.formatMessage({
                                        id: 'FARMING_TOKEN',
                                    }, {
                                        amount: shareAmount(
                                            lpTokenAmount,
                                            pairBalanceRight,
                                            pairBalanceLp,
                                            rightToken.decimals,
                                        ),
                                        symbol: rightToken.symbol,
                                    })}
                                </div>
                            </div>
                        )
                    }

                    <div>
                        <div className="farming-panel__label">
                            {intl.formatMessage({
                                id: 'FARMING_BASE_INFO_LP_TOKENS',
                            }, {
                                symbol: lpTokenSymbol,
                            })}
                        </div>
                        {amountOrZero(lpTokenAmount, lpTokenDecimal)}
                    </div>
                </div>
            </div>

            <div className="farming-panel farming-panel_compact">
                <div className="farming-panel__label">
                    {intl.formatMessage({
                        id: 'FARMING_BASE_INFO_APR',
                    })}
                </div>
                {intl.formatMessage({
                    id: 'FARMING_BASE_INFO_APR_VALUE',
                }, {
                    value: amountOrZero(apr, 0),
                })}
            </div>

            <div className="farming-panel farming-panel_compact">
                <div className="farming-panel__label">
                    {intl.formatMessage({
                        id: 'FARMING_BASE_INFO_REWARD',
                    })}
                </div>
                {rewardTokens.map((token, index) => (
                    token && (
                        <div className="farming-panel__token" key={token.root}>
                            <TokenIcon
                                size="xsmall"
                                uri={token.icon}
                                address={token.root}
                            />
                            {intl.formatMessage({
                                id: 'FARMING_TOKEN',
                            }, {
                                amount: amountOrZero(rewardTokensAmount[index], token.decimals),
                                symbol: token.symbol,
                            })}
                        </div>
                    )
                ))}
            </div>

            <div className="farming-panel farming-panel_compact">
                <div className="farming-panel__label">
                    {intl.formatMessage({
                        id: 'FARMING_BASE_INFO_SPEED',
                    })}
                </div>
                {rewardTokens.map((token, index) => (
                    token && (
                        <div className="farming-panel__token" key={token.root}>
                            <TokenIcon
                                size="xsmall"
                                uri={token.icon}
                                address={token.root}
                            />
                            {intl.formatMessage({
                                id: 'FARMING_TOKEN',
                            }, {
                                amount: amountOrZero(rpsAmount[index], token.decimals),
                                symbol: token.symbol,
                            })}
                        </div>
                    )
                ))}
            </div>
        </div>
    )
}

export const FarmingBaseInfo = observer(FarmingBaseInfoInner)
