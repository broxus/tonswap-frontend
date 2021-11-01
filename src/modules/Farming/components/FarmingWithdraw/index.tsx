import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { FarmingAction } from '@/modules/Farming/components/FarmingAction'
import { useTokensCache } from '@/stores/TokensCacheService'
import { formattedAmount, isExists } from '@/utils'

enum Tab {
    Claim = 1,
    Withdraw = 2,
}

type Props = {
    loading?: boolean;
    farmingAmount?: string;
    withdrawAmount?: string;
    withdrawDisabled?: boolean;
    claimDisabled?: boolean;
    tokenSymbol: string;
    tokenDecimals: number;
    rewardTokenRoots: string[];
    rewardAmounts: string[];
    onChangeWithdraw: (value: string) => void;
    onWithdraw: (amount: string) => void;
    onClaim: () => void;
}

export function FarmingWithdrawInner({
    loading,
    farmingAmount = '0',
    withdrawAmount,
    withdrawDisabled,
    claimDisabled,
    tokenSymbol,
    tokenDecimals,
    rewardTokenRoots,
    rewardAmounts,
    onChangeWithdraw,
    onWithdraw,
    onClaim,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const [activeTab, setActiveTab] = React.useState(Tab.Claim)
    const rewardTokens = rewardTokenRoots.map(root => tokensCache.get(root))
    const rewards = rewardTokens
        .map((token, index) => (
            token && {
                amount: formattedAmount(rewardAmounts[index], token.decimals),
                symbol: token.symbol,
            }
        ))
        .filter(isExists)

    const maxValue = React.useMemo(
        () => new BigNumber(farmingAmount).shiftedBy(-tokenDecimals).toFixed(),
        [farmingAmount, tokenDecimals],
    )

    const balance = React.useMemo(
        () => formattedAmount(farmingAmount, tokenDecimals),
        [farmingAmount, tokenDecimals],
    )

    const onClickClaimTab = () => {
        setActiveTab(Tab.Claim)
    }

    const onClickWithdrawTab = () => {
        setActiveTab(Tab.Withdraw)
    }

    return (
        <div className="farming-balance-panel farming-balance-panel_withdraw">
            <div className="farming-balance-panel__title">
                {intl.formatMessage({
                    id: 'FARMING_BALANCE_WITHDRAW_TITLE',
                })}
            </div>

            <ul className="farming-balance-panel__tabs">
                <li
                    className={activeTab === Tab.Claim ? 'active' : undefined}
                    onClick={onClickClaimTab}
                >
                    {intl.formatMessage({
                        id: 'FARMING_BALANCE_WITHDRAW_CLAIM_TAB',
                    })}
                </li>
                <li
                    className={activeTab === Tab.Withdraw ? 'active' : undefined}
                    onClick={onClickWithdrawTab}
                >
                    {intl.formatMessage({
                        id: 'FARMING_BALANCE_WITHDRAW_WITHDRAW_TAB',
                    })}
                </li>
            </ul>

            {activeTab === Tab.Claim && (
                <FarmingAction
                    decimals={tokenDecimals}
                    inputDisabled
                    loading={loading}
                    submitDisabled={claimDisabled}
                    action={intl.formatMessage({
                        id: 'FARMING_BALANCE_WITHDRAW_ACTION_CLAIM',
                    })}
                    value={rewards.map(({ amount, symbol }) => (
                        intl.formatMessage({
                            id: 'FARMING_BALANCE_TOKEN',
                        }, {
                            amount,
                            symbol,
                        })
                    )).join(', ')}
                    onSubmit={onClaim}
                />
            )}

            {activeTab === Tab.Withdraw && (
                <FarmingAction
                    decimals={tokenDecimals}
                    loading={loading}
                    value={withdrawAmount || ''}
                    maxValue={maxValue}
                    submitDisabled={withdrawDisabled}
                    action={intl.formatMessage({
                        id: 'FARMING_BALANCE_WITHDRAW_ACTION_WITHDRAW',
                    })}
                    hint={intl.formatMessage({
                        id: 'FARMING_BALANCE_WITHDRAW_BALANCE',
                    }, {
                        value: balance,
                        symbol: tokenSymbol,
                    })}
                    onChange={onChangeWithdraw}
                    onSubmit={onWithdraw}
                />
            )}
        </div>
    )
}

export const FarmingWithdraw = observer(FarmingWithdrawInner)
