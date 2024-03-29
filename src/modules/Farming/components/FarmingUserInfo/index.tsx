import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokensCache } from '@/stores/TokensCacheService'
import {
    formatDateUTC, formattedAmount,
    formattedTokenAmount,
    parseCurrencyBillions,
    shareAmount,
} from '@/utils'

import './index.scss'

type Props = {
    userUsdtBalance?: string | null;
    userLpFarmingAmount?: string;
    leftTokenAddress?: string;
    rightTokenAddress?: string;
    lpTokenSymbol?: string;
    lpTokenDecimals?: number;
    pairBalanceLeft?: string;
    pairBalanceRight?: string;
    pairBalanceLp?: string;
    rewardTokensAddress?: string[];
    unclaimedAmounts?: string[];
    entitledAmounts?: string[];
    debtAmounts?: string[];
    userShare?: string;
    userHistoryUsdtBalance?: string | null;
    userHistoryLeftAmount?: string | null;
    userHistoryRightAmount?: string | null;
    userHistoryLastUpdateTime?: number,
    vestingTime?: number[];
    rewardTotalBalance?: string;
}

function FarmingUserInfoInner({
    userUsdtBalance,
    userLpFarmingAmount,
    leftTokenAddress,
    rightTokenAddress,
    lpTokenSymbol,
    lpTokenDecimals,
    pairBalanceLeft,
    pairBalanceRight,
    pairBalanceLp,
    rewardTokensAddress,
    unclaimedAmounts = [],
    entitledAmounts = [],
    debtAmounts = [],
    userShare,
    userHistoryUsdtBalance,
    userHistoryLeftAmount,
    userHistoryRightAmount,
    userHistoryLastUpdateTime,
    vestingTime,
    rewardTotalBalance,
}: Props) {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const leftToken = leftTokenAddress && tokensCache.get(leftTokenAddress)
    const rightToken = rightTokenAddress && tokensCache.get(rightTokenAddress)
    const rewardTokens = (rewardTokensAddress || []).map(root => tokensCache.get(root))
    const nullMessage = intl.formatMessage({
        id: 'FARMING_USER_INFO_NULL',
    })
    const hasDebt = debtAmounts.findIndex(amount => (
        new BigNumber(amount).isGreaterThan(0)
    )) > -1

    return (
        <div className="farming-user-info">
            <div className="farming-panel">
                <div className="farming-panel__rows">
                    {userUsdtBalance !== undefined && (
                        <div>
                            <div className="farming-panel__label">
                                {intl.formatMessage({
                                    id: 'FARMING_USER_INFO_FARMING_BALANCE',
                                })}
                            </div>
                            <div className="farming-panel__value">
                                {
                                    userUsdtBalance === null
                                        ? nullMessage
                                        : parseCurrencyBillions(userUsdtBalance)
                                }
                            </div>
                        </div>
                    )}

                    {
                        leftToken
                        && rightToken
                        && pairBalanceLp
                        && pairBalanceRight
                        && pairBalanceLeft
                        && userLpFarmingAmount
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
                                        icon={leftToken.icon}
                                        address={leftToken.root}
                                    />
                                    {intl.formatMessage({
                                        id: 'FARMING_TOKEN',
                                    }, {
                                        amount: formattedTokenAmount(shareAmount(
                                            userLpFarmingAmount,
                                            pairBalanceLeft,
                                            pairBalanceLp,
                                            leftToken.decimals,
                                        )),
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
                                        amount: formattedTokenAmount(shareAmount(
                                            userLpFarmingAmount,
                                            pairBalanceRight,
                                            pairBalanceLp,
                                            rightToken.decimals,
                                        )),
                                        symbol: rightToken.symbol,
                                    })}
                                </div>
                            </div>
                        )
                    }

                    {userLpFarmingAmount && (
                        <div>
                            <div className="farming-panel__label">
                                {intl.formatMessage({
                                    id: 'FARMING_USER_INFO_LP_TOKENS',
                                }, {
                                    symbol: lpTokenSymbol,
                                })}
                            </div>
                            {formattedTokenAmount(userLpFarmingAmount, lpTokenDecimals)}
                        </div>
                    )}

                    {userShare !== undefined && (
                        <div>
                            <div className="farming-panel__label">
                                {intl.formatMessage({
                                    id: 'FARMING_USER_INFO_SHARE',
                                })}
                            </div>
                            {intl.formatMessage({
                                id: 'FARMING_USER_INFO_SHARE_VALUE',
                            }, {
                                value: userShare,
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="farming-panel">
                <div className="farming-panel__rows">
                    {userHistoryUsdtBalance !== undefined && (
                        <div>
                            <div className="farming-panel__label">
                                {intl.formatMessage({
                                    id: 'FARMING_USER_INFO_HISTORY_BALANCE',
                                })}
                            </div>
                            <div className="farming-panel__value">
                                {
                                    userHistoryUsdtBalance === null
                                        ? nullMessage
                                        : parseCurrencyBillions(userHistoryUsdtBalance)
                                }
                            </div>
                        </div>
                    )}

                    {
                        leftToken
                        && rightToken
                        && userHistoryLeftAmount !== undefined
                        && userHistoryRightAmount !== undefined
                        && (
                            <div>
                                <div className="farming-panel__label">
                                    {intl.formatMessage({
                                        id: 'FARMING_USER_INFO_HISTORY_TOKENS',
                                    })}
                                </div>
                                <div className="farming-panel__token">
                                    <TokenIcon
                                        size="xsmall"
                                        icon={leftToken.icon}
                                        address={leftToken.root}
                                    />
                                    {
                                        userHistoryLeftAmount === null
                                            ? nullMessage
                                            : intl.formatMessage({
                                                id: 'FARMING_TOKEN',
                                            }, {
                                                amount: formattedTokenAmount(userHistoryLeftAmount),
                                                symbol: leftToken.symbol,
                                            })
                                    }
                                </div>
                                <div className="farming-panel__token">
                                    <TokenIcon
                                        size="xsmall"
                                        icon={rightToken.icon}
                                        address={rightToken.root}
                                    />
                                    {
                                        userHistoryRightAmount === null
                                            ? nullMessage
                                            : intl.formatMessage({
                                                id: 'FARMING_TOKEN',
                                            }, {
                                                amount: formattedTokenAmount(userHistoryRightAmount),
                                                symbol: rightToken.symbol,
                                            })
                                    }
                                </div>
                            </div>
                        )
                    }

                    {userHistoryLastUpdateTime && (
                        <div>
                            <div className="farming-panel__label">
                                {intl.formatMessage({
                                    id: 'FARMING_USER_INFO_HISTORY_LAST_UPD',
                                })}
                            </div>
                            {formatDateUTC(userHistoryLastUpdateTime)}
                        </div>
                    )}
                </div>
            </div>

            <div className="farming-panel">
                <div className="farming-panel__rows">
                    {rewardTotalBalance !== undefined && (
                        <div>
                            <div className="farming-panel__label">
                                {intl.formatMessage({
                                    id: 'FARMING_USER_INFO_TOTAL_REWARD',
                                })}
                            </div>
                            <div className="farming-panel__value">
                                {
                                    rewardTotalBalance === null
                                        ? nullMessage
                                        : `$${formattedAmount(rewardTotalBalance, undefined, {
                                            truncate: 2,
                                        })}`
                                }
                            </div>
                        </div>
                    )}

                    <div key="unclaimed">
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
                                        icon={token.icon}
                                        address={token.root}
                                    />
                                    {intl.formatMessage({
                                        id: 'FARMING_TOKEN',
                                    }, {
                                        amount: formattedTokenAmount(unclaimedAmounts[index], token.decimals),
                                        symbol: token.symbol,
                                    })}
                                </div>
                            )
                        ))}
                    </div>

                    {hasDebt && (
                        <div key="debt">
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
                                            icon={token.icon}
                                            address={token.root}
                                        />
                                        {intl.formatMessage({
                                            id: 'FARMING_TOKEN',
                                        }, {
                                            amount: formattedTokenAmount(debtAmounts[index], token.decimals),
                                            symbol: token.symbol,
                                        })}
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                    <div key="entitled">
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
                                        icon={token.icon}
                                        address={token.root}
                                    />
                                    {intl.formatMessage({
                                        id: 'FARMING_TOKEN',
                                    }, {
                                        amount: formattedTokenAmount(entitledAmounts[index], token.decimals),
                                        symbol: token.symbol,
                                    })}
                                </div>
                            )
                        ))}
                    </div>

                    {vestingTime && (
                        <div>
                            <div className="farming-panel__label">
                                {intl.formatMessage({
                                    id: 'FARMING_USER_INFO_VESTING_TIME',
                                })}
                            </div>

                            {[...new Set(vestingTime)].length > 1 ? (
                                rewardTokens.map((token, index) => (
                                    token && (
                                        <div className="farming-panel__token" key={token.root}>
                                            <TokenIcon
                                                size="xsmall"
                                                icon={token.icon}
                                                address={token.root}
                                            />
                                            {formatDateUTC(vestingTime[index])}
                                        </div>
                                    )
                                ))
                            ) : (
                                formatDateUTC(vestingTime[0])
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export const FarmingUserInfo = observer(FarmingUserInfoInner)
