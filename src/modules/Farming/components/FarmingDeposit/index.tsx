import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { FarmingAction } from '@/modules/Farming/components/FarmingAction'

type Props = {
    walletAmount: string;
    depositAmount?: string;
    depositDisabled?: boolean;
    rootTokenSymbol: string;
    loading?: boolean;
    onChangeDeposit: (value: string) => void;
    onDeposit: (amount: string) => void;
}

export function FarmingDepositInner({
    walletAmount,
    depositAmount,
    depositDisabled,
    rootTokenSymbol,
    loading,
    onChangeDeposit,
    onDeposit,
}: Props): JSX.Element {
    const intl = useIntl()

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
                value={depositAmount || ''}
                maxValue={walletAmount}
                submitDisabled={depositDisabled}
                action={intl.formatMessage({
                    id: 'FARMING_BALANCE_DEPOSIT_ACTION',
                })}
                hint={intl.formatMessage({
                    id: 'FARMING_BALANCE_DEPOSIT_BALANCE',
                }, {
                    value: walletAmount,
                    symbol: rootTokenSymbol,
                })}
                onChange={onChangeDeposit}
                onSubmit={onDeposit}
            />
        </div>
    )
}

export const FarmingDeposit = observer(FarmingDepositInner)
