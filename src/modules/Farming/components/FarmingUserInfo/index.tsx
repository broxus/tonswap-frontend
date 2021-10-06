import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokensCache } from '@/stores/TokensCacheService'
import { amountOrZero, parseCurrencyBillions, shareAmount } from '@/utils'

import './index.scss'

type Props = {
    tvl: string;
    userLpBalance: string;
    leftTokenRoot?: string;
    rightTokenRoot?: string;
    lpTokenSymbol?: string;
    lpTokenDecimals?: number;
    pairBalanceLeft?: string;
    pairBalanceRight?: string;
    pairBalanceLp?: string;
    rewardTokensRoots: string[];
    unclaimedAmounts: string[];
    entitledAmounts: string[];
    debtAmounts: string[];
    userShare: string;
}

function FarmingUserInfoInner({
    tvl,
    userLpBalance,
    leftTokenRoot,
    rightTokenRoot,
    lpTokenSymbol,
    lpTokenDecimals,
    pairBalanceLeft,
    pairBalanceRight,
    pairBalanceLp,
    rewardTokensRoots,
    unclaimedAmounts,
    entitledAmounts,
    debtAmounts,
    userShare,
}: Props) {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const leftToken = leftTokenRoot && tokensCache.get(leftTokenRoot)
    const rightToken = rightTokenRoot && tokensCache.get(rightTokenRoot)
    const rewardTokens = rewardTokensRoots.map(root => tokensCache.get(root))
    const totalBalance = new BigNumber(tvl).dividedBy(2)
    const leftUserBalance = pairBalanceLp && pairBalanceLeft && userLpBalance
        && new BigNumber(userLpBalance).times(pairBalanceLeft).dividedBy(pairBalanceLp)
    const userBalance = leftUserBalance && pairBalanceLeft
        && totalBalance.times(leftUserBalance).dividedBy(pairBalanceLeft).times(2)

    return (
        <div className="farming-user-info">
            <div className="farming-panel">
                <div className="farming-panel__rows">
                    {userBalance && (
                        <div>
                            <div className="farming-panel__label">
                                {intl.formatMessage({
                                    id: 'FARMING_USER_INFO_FARMING_BALANCE',
                                })}
                            </div>
                            <div className="farming-panel__value">
                                {parseCurrencyBillions(userBalance)}
                            </div>
                        </div>
                    )}

                    {
                        leftToken
                        && rightToken
                        && pairBalanceLp
                        && pairBalanceRight
                        && pairBalanceLeft
                        && (
                            <div>
                                <div className="farming-panel__label">
                                    {intl.formatMessage({
                                        id: 'FARMING_USER_INFO_TOKENS',
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
                                            userLpBalance,
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
                                            userLpBalance,
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
                                id: 'FARMING_USER_INFO_LP_TOKENS',
                            }, {
                                symbol: lpTokenSymbol,
                            })}
                        </div>
                        {amountOrZero(userLpBalance, lpTokenDecimals)}
                    </div>

                    <div>
                        <div className="farming-panel__label">
                            {intl.formatMessage({
                                id: 'FARMING_USER_INFO_SHARE',
                            })}
                        </div>
                        {intl.formatMessage({
                            id: 'FARMING_USER_INFO_SHARE_VALUE',
                        }, {
                            value: amountOrZero(userShare, 0),
                        })}
                    </div>
                </div>
            </div>

            <div className="farming-panel">
                <div className="farming-panel__rows">
                    <div>
                        <div className="farming-panel__label">
                            {intl.formatMessage({
                                id: 'FARMING_USER_INFO_ENTITLED_TITLE',
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
                                        amount: amountOrZero(entitledAmounts[index], token.decimals),
                                        symbol: token.symbol,
                                    })}
                                </div>
                            )
                        ))}
                    </div>

                    <div>
                        <div className="farming-panel__label">
                            {intl.formatMessage({
                                id: 'FARMING_USER_INFO_UNCLAIMED_TITLE',
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
                                        amount: amountOrZero(unclaimedAmounts[index], token.decimals),
                                        symbol: token.symbol,
                                    })}
                                </div>
                            )
                        ))}
                    </div>
                    <div>
                        <div className="farming-panel__label">
                            {intl.formatMessage({
                                id: 'FARMING_USER_INFO_DEBT_TITLE',
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
                                        amount: amountOrZero(debtAmounts[index], token.decimals),
                                        symbol: token.symbol,
                                    })}
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export const FarmingUserInfo = observer(FarmingUserInfoInner)
