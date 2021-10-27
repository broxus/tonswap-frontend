import * as React from 'react'
import { DateTime } from 'luxon'
import { useIntl } from 'react-intl'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { TransactionExplorerLink } from '@/components/common/TransactionExplorerLink'
import { TransactionInfo } from '@/modules/Transactions/types'
import { EVENTS_MESSAGES } from '@/modules/Transactions/constants'
import { useTokensCache } from '@/stores/TokensCacheService'
import { formattedBalance, parseCurrencyBillions } from '@/utils'


type Props = {
    transaction: TransactionInfo;
}


export function Item({ transaction }: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()

    const leftToken = React.useMemo(
        () => tokensCache.tokens.find(({ root }) => root === transaction.leftAddress),
        [transaction.leftAddress],
    )

    const rightToken = React.useMemo(
        () => tokensCache.tokens.find(({ root }) => root === transaction.rightAddress),
        [transaction.rightAddress],
    )

    const transactionEvent = React.useMemo(() => intl.formatMessage({
        id: EVENTS_MESSAGES[transaction.eventType],
    }, {
        leftSymbol: leftToken?.symbol,
        rightSymbol: rightToken?.symbol,
    }), [transaction.eventType, leftToken, rightToken])

    const totalValue = React.useMemo(() => parseCurrencyBillions(transaction.tv), [transaction.tv])

    const leftValue = React.useMemo(
        () => `${formattedBalance(transaction.leftValue || '0', leftToken?.decimals || 0)} ${leftToken?.symbol}`,
        [leftToken, transaction.leftValue],
    )

    const rightValue = React.useMemo(
        () => `${formattedBalance(transaction.rightValue || '0', rightToken?.decimals || 0)} ${rightToken?.symbol}`,
        [rightToken, transaction.rightValue],
    )

    return (
        <div className="list__row">
            <div className="list__cell list__cell--left">
                <TransactionExplorerLink id={transaction.transactionHash}>
                    {transactionEvent}
                </TransactionExplorerLink>
            </div>
            <div className="list__cell list__cell--right">
                {totalValue}
            </div>
            <div className="list__cell list__cell--right hide-824">
                {leftValue}
            </div>
            <div className="list__cell list__cell--right hide-824">
                {rightValue}
            </div>
            <div className="list__cell list__cell--right hide-824">
                <AccountExplorerLink address={transaction.userAddress} />
            </div>
            <div className="list__cell list__cell--right hide-540">
                <TransactionExplorerLink id={transaction.transactionHash}>
                    {DateTime.fromSeconds(transaction.timestampBlock).toRelative()}
                </TransactionExplorerLink>
            </div>
        </div>
    )
}
