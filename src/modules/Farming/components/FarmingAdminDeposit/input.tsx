import * as React from 'react'
import { useIntl } from 'react-intl'

import { FarmingAction } from '@/modules/Farming/components/FarmingAction'
import { amountOrZero } from '@/utils'

import './index.scss'

type Props = {
    balance: string;
    amount: string;
    decimals: number;
    symbol: string;
    valid: boolean;
    loading: boolean;
    index: number;
    onChange: (index: number, value: string) => void;
    onSubmit: (indx: number) => void;
}

export function FarmingAdminDepositInput({
    balance,
    amount,
    decimals,
    symbol,
    valid,
    loading,
    index,
    onChange,
    onSubmit,
}: Props): JSX.Element {
    const intl = useIntl()

    const onChangeAction = (value: string) => {
        onChange(index, value)
    }

    const onSubmitAction = () => {
        onSubmit(index)
    }

    return (
        <FarmingAction
            action={intl.formatMessage({
                id: 'FARMING_ADMIN_DEPOSIT_ACTION',
            })}
            hint={intl.formatMessage({
                id: 'FARMING_ADMIN_DEPOSIT_HINT',
            }, {
                amount: amountOrZero(balance, decimals),
                symbol,
            })}
            value={amount}
            submitDisabled={!valid}
            maxValue={amountOrZero(balance, decimals)}
            loading={loading}
            onChange={onChangeAction}
            onSubmit={onSubmitAction}
        />
    )
}
