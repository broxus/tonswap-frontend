import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Warning } from '@/components/common/Warning'
import { FarmingAdminDepositBalance } from '@/modules/Farming/components/FarmingAdminDeposit/balance'
import { FarmingAdminDepositInput } from '@/modules/Farming/components/FarmingAdminDeposit/input'
import { useTokensCache } from '@/stores/TokensCacheService'
import { formattedAmount } from '@/utils'

import './index.scss'

type Props = {
    formData: {
        amount: string;
        loading: boolean;
        tokenRoot: string;
        userBalance: string;
        poolBalance: string;
        valid: boolean;
    }[];
    showWarning?: boolean;
    onChange: (index: number, value: string) => void;
    onSubmit: (index: number) => void;
}

function FarmingAdminDepositInner({
    showWarning,
    formData,
    onChange,
    onSubmit,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const tokens = formData.map(({ tokenRoot }) => tokensCache.get(tokenRoot))

    return (
        <div className="farming-panel">
            <div className="farming-panel__rows">
                <div>
                    <h3 className="farming-panel__title">
                        {intl.formatMessage({
                            id: 'FARMING_ADMIN_DEPOSIT_TITLE',
                        })}
                    </h3>
                    <div className="farming-panel__text">
                        {intl.formatMessage({
                            id: 'FARMING_ADMIN_DEPOSIT_TEXT',
                        })}
                    </div>
                </div>

                {showWarning === true && (
                    <div>
                        <Warning
                            title={intl.formatMessage({
                                id: 'FARMING_ADMIN_DEPOSIT_WARNING_TITLE',
                            })}
                            text={intl.formatMessage({
                                id: 'FARMING_ADMIN_DEPOSIT_WARNING_TEXT',
                            })}
                        />
                    </div>
                )}

                {tokens.map((token, index) => (
                    token && (
                        <div key={token.root}>
                            <FarmingAdminDepositBalance
                                tokenRoot={token.root}
                                symbol={token.symbol}
                                amount={formattedAmount(formData[index].poolBalance, token.decimals)}
                            />

                            <FarmingAdminDepositInput
                                balance={formData[index].userBalance}
                                amount={formData[index].amount}
                                decimals={token.decimals}
                                symbol={token.symbol}
                                valid={formData[index].valid}
                                loading={formData[index].loading}
                                index={index}
                                onChange={onChange}
                                onSubmit={onSubmit}
                            />
                        </div>
                    )
                ))}
            </div>
        </div>
    )
}

export const FarmingAdminDeposit = observer(FarmingAdminDepositInner)
