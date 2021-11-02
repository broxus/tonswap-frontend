import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { FarmingAction } from '@/modules/Farming/components/FarmingAction'
import { formattedAmount } from '@/utils'

type Props = {
    walletAmount?: string;
    depositAmount?: string;
    depositDisabled?: boolean;
    tokenSymbol: string;
    tokenDecimals: number;
    loading?: boolean;
    onChangeDeposit: (value: string) => void;
    onDeposit: (amount: string) => void;
}

export function FarmingDepositInner({
    walletAmount = '0',
    depositAmount,
    depositDisabled,
    tokenSymbol,
    tokenDecimals,
    loading,
    onChangeDeposit,
    onDeposit,
}: Props): JSX.Element {
    const intl = useIntl()

    const maxValue = React.useMemo(
        () => new BigNumber(walletAmount).shiftedBy(-tokenDecimals).toFixed(),
        [walletAmount, tokenDecimals],
    )

    const balance = React.useMemo(
        () => formattedAmount(walletAmount, tokenDecimals),
        [walletAmount, tokenDecimals],
    )

    return (
        <div className="farming-balance-panel farming-balance-panel_deposit">
            <div className="farming-balance-panel__title">
                {intl.formatMessage({
                    id: 'FARMING_BALANCE_DEPOSIT_TITLE',
                })}
            </div>

            <div className="farming-balance-panel__text">
                {intl.formatMessage({
                    id: 'FARMING_BALANCE_DEPOSIT_TEXT',
                })}
            </div>

            <FarmingAction
                loading={loading}
                decimals={tokenDecimals}
                value={depositAmount || ''}
                maxValue={maxValue}
                submitDisabled={depositDisabled}
                action={intl.formatMessage({
                    id: 'FARMING_BALANCE_DEPOSIT_ACTION',
                })}
                hint={intl.formatMessage({
                    id: 'FARMING_BALANCE_DEPOSIT_BALANCE',
                }, {
                    value: balance,
                    symbol: tokenSymbol,
                })}
                onChange={onChangeDeposit}
                onSubmit={onDeposit}
            />
        </div>
    )
}

export const FarmingDeposit = observer(FarmingDepositInner)
