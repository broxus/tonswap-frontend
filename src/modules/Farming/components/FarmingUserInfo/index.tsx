import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokensCache } from '@/stores/TokensCacheService'
import { amountOrZero, parseCurrencyBillions, shareAmount } from '@/utils'

import './index.scss'

type Props = {
    userUsdtBalance: string | null;
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
    userUsdtBalance,
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

    return (
        <div className="farming-user-info">
            <div className="farming-panel">
                <div className="farming-panel__rows">
                    <div>
                        <div className="farming-panel__label">
                            {intl.formatMessage({
                                id: 'FARMING_USER_INFO_FARMING_BALANCE',
                            })}
                        </div>
                        <div className="farming-panel__value">
                            {userUsdtBalance === null ? intl.formatMessage({
                                id: 'FARMING_USER_INFO_NULL',
                            }) : parseCurrencyBillions(userUsdtBalance)}
                        </div>
                    </div>

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
                                        amount: amountOrZero(shareAmount(
                                            userLpBalance,
                                            pairBalanceLeft,
                                            pairBalanceLp,
                                            leftToken.decimals,
                                        ), 0),
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
                                        amount: amountOrZero(shareAmount(
                                            userLpBalance,
                                            pairBalanceRight,
                                            pairBalanceLp,
                                            rightToken.decimals,
                                        ), 0),
                                        symbol: rightToken.symbol,
                                    })}
                                </div>
                            </div>
                        )
                    }

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
