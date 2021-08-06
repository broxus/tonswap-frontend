import * as React from 'react'
import { DateTime } from 'luxon'
import { useIntl } from 'react-intl'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { TransactionInfo } from '@/modules/Transactions/types'
import { EVENTS_MESSAGES } from '@/modules/Transactions/constants'
import { useTokensCache } from '@/stores/TokensCacheService'
import { formatBalance, parseCurrencyBillions } from '@/utils'


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
        () => `${formatBalance(transaction.leftValue || '0', leftToken?.decimals || 0)} ${leftToken?.symbol}`,
        [leftToken, transaction.leftValue],
    )

    const rightValue = React.useMemo(
        () => `${formatBalance(transaction.rightValue || '0', rightToken?.decimals || 0)} ${rightToken?.symbol}`,
        [rightToken, transaction.rightValue],
    )

    return (
        <div className="list__row">
            <div className="list__cell list__cell--left">
                {transactionEvent}
            </div>
            <div className="list__cell list__cell--right">
                {totalValue}
            </div>
            <div className="list__cell list__cell--right">
                {leftValue}
            </div>
            <div className="list__cell list__cell--right">
                {rightValue}
            </div>
            <div className="list__cell list__cell--right">
                <AccountExplorerLink address={transaction.userAddress} />
            </div>
            <div className="list__cell list__cell--right">
                {DateTime.fromSeconds(transaction.timestampBlock).toRelative()}
            </div>
        </div>
    )
}
