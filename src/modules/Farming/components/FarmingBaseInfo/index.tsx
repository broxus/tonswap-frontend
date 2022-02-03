import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokensCache } from '@/stores/TokensCacheService'
import { formattedAmount, formattedTokenAmount, parseCurrencyBillions } from '@/utils'

import './index.scss'

type Props = {
    tvl?: string | null;
    apr?: string | null;
    rpsAmount?: string[];
    lpTokenBalance?: string;
    lpTokenSymbol?: string;
    rewardTokensRoot?: string[];
    rewardTokensAmount?: string[];
    leftTokenRoot?: string;
    rightTokenRoot?: string;
    leftTokenBalance?: string;
    rightTokenBalance?: string;
}

function FarmingBaseInfoInner({
    tvl,
    apr,
    rewardTokensRoot = [],
    rewardTokensAmount,
    rpsAmount,
    lpTokenSymbol,
    lpTokenBalance,
    leftTokenRoot,
    rightTokenRoot,
    leftTokenBalance,
    rightTokenBalance,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const rewardTokens = rewardTokensRoot.map(root => tokensCache.get(root))
    const leftToken = leftTokenRoot && tokensCache.get(leftTokenRoot)
    const rightToken = rightTokenRoot && tokensCache.get(rightTokenRoot)
    const nullMessage = intl.formatMessage({ id: 'FARMING_BASE_INFO_NULL' })

    return (
        <div className="farming-base-info">
            <div className="farming-panel farming-panel_compact">
                <div className="farming-panel__rows">
                    {tvl !== undefined && (
                        <div key="tvl">
                            <div className="farming-panel__label">
                                {intl.formatMessage({
                                    id: 'FARMING_BASE_INFO_TVL',
                                })}
                            </div>
                            <div className="farming-panel__value">
                                {tvl === null ? nullMessage : parseCurrencyBillions(tvl)}
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="farming-panel__label">
                            {intl.formatMessage({
                                id: 'FARMING_BASE_INFO_LP_TOKENS',
                            }, {
                                symbol: lpTokenSymbol,
                            })}
                        </div>
                        {formattedAmount(lpTokenBalance)}
                    </div>

                    {
                        leftToken
                        && rightToken
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
                                        icon={leftToken.icon}
                                        address={leftToken.root}
                                    />

                                    {intl.formatMessage({
                                        id: 'FARMING_TOKEN',
                                    }, {
                                        amount: formattedTokenAmount(leftTokenBalance),
                                        symbol: leftToken.symbol,
                                    })}
                                </div>
                                <div className="farming-panel__token">
                                    <TokenIcon
                                        size="xsmall"
                                        icon={rightToken.icon}
                                        address={rightToken.root}
                                    />
                                    {intl.formatMessage({
                                        id: 'FARMING_TOKEN',
                                    }, {
                                        amount: formattedTokenAmount(rightTokenBalance),
                                        symbol: rightToken.symbol,
                                    })}
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>

            {apr !== undefined && (
                <div className="farming-panel farming-panel_compact">
                    <div className="farming-panel__label">
                        {intl.formatMessage({
                            id: 'FARMING_BASE_INFO_APR',
                        })}
                    </div>
                    {apr === null ? nullMessage : intl.formatMessage({
                        id: 'FARMING_BASE_INFO_APR_VALUE',
                    }, {
                        value: formattedAmount(apr),
                    })}
                </div>
            )}

            {rewardTokensAmount && (
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
                                    icon={token.icon}
                                    address={token.root}
                                />
                                {intl.formatMessage({
                                    id: 'FARMING_TOKEN',
                                }, {
                                    amount: formattedTokenAmount(
                                        rewardTokensAmount[index],
                                        token.decimals,
                                    ),
                                    symbol: token.symbol,
                                })}
                            </div>
                        )
                    ))}
                </div>
            )}

            {rpsAmount && (
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
                                    icon={token.icon}
                                    address={token.root}
                                />
                                {intl.formatMessage({
                                    id: 'FARMING_TOKEN',
                                }, {
                                    amount: formattedAmount(rpsAmount[index], undefined, {
                                        preserve: true,
                                    }),
                                    symbol: token.symbol,
                                })}
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    )
}

export const FarmingBaseInfo = observer(FarmingBaseInfoInner)
