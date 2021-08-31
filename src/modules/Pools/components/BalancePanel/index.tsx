import * as React from 'react'
import { useIntl } from 'react-intl'

import { TokenIcon } from '@/components/common/TokenIcon'

type Props = {
    title: string
    symbol: string
    balance: string
    tokens: {
        uri?: string
        amount: string
        address: string
    }[]
}

export function BalancePanel({
    title,
    symbol,
    balance,
    tokens,
}: Props): JSX.Element {
    const intl = useIntl()

    return (
        <div className="card card--small card--flat">
            <div className="balance">
                <h4 className="balance__title">{title}</h4>

                <div className="balance-rows">
                    <div className="balance-section">
                        <h5 className="balance-section__title">
                            {intl.formatMessage({ id: 'POOLS_LIST_AMOUNT' }, { name: symbol })}
                        </h5>
                        <div className="balance-section__content">{balance}</div>
                    </div>

                    <div className="balance-section">
                        <h5 className="balance-section__title">
                            {intl.formatMessage({ id: 'POOLS_LIST_APPORTIONMENT' })}
                        </h5>
                        <div className="balance-section__content">
                            {tokens.map(token => (
                                <div className="balance__token" key={token.address}>
                                    <TokenIcon address={token.address} size="xsmall" uri={token.uri} />
                                    {token.amount}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
