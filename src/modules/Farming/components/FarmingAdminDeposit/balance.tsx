import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokensCache } from '@/stores/TokensCacheService'

import './index.scss'

type Props = {
    amount: string;
    symbol: string;
    required?: string;
    tokenRoot: string;
}

function FarmingAdminDepositBalanceInner({
    amount,
    symbol,
    required,
    tokenRoot,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const token = tokensCache.get(tokenRoot)

    return (
        <div className="farming-admin-deposit-balance">
            <TokenIcon
                size="xsmall"
                uri={token?.icon}
                address={token?.root}
            />

            <div
                dangerouslySetInnerHTML={{
                    __html: intl.formatMessage({
                        id: required
                            ? 'FARMING_ADMIN_DEPOSIT_REQUIRED_BALANCE'
                            : 'FARMING_ADMIN_DEPOSIT_BALANCE',
                    }, {
                        amount,
                        symbol,
                        required,
                    }, {
                        ignoreTag: true,
                    }),
                }}
            />
        </div>
    )
}

export const FarmingAdminDepositBalance = observer(FarmingAdminDepositBalanceInner)
