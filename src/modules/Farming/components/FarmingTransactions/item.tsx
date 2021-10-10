import * as React from 'react'
import { useIntl } from 'react-intl'
import { DateTime } from 'luxon'

import { Tooltip } from '@/components/common/Tooltip'
import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { Transaction } from '@/modules/Farming/types'
import { amountOrZero, parseCurrencyBillions } from '@/utils'

import './index.scss'

type Props = {
    transaction: Transaction;
    lpTokenSymbol: string;
    leftTokenSymbol?: string;
    rightTokenSymbol?: string;
    isExternalLpToken: boolean;
    isActionTable: boolean;
}

export function FarmingTransactionsItem({
    transaction,
    lpTokenSymbol,
    leftTokenSymbol,
    rightTokenSymbol,
    isExternalLpToken,
    isActionTable,
}: Props): JSX.Element {
    const lpTokenRef = React.useRef<HTMLDivElement | null>(null)
    const intl = useIntl()
    const nullMessage = intl.formatMessage({
        id: 'TRANSACTIONS_LIST_NULL',
    })

    return (
        <div className="list__row">
            {!isActionTable && (
                <div className="list__cell list__cell--left">
                    {transaction.kind}
                </div>
            )}

            <div className={`list__cell list__cell--${isActionTable ? 'left' : 'right'}`}>
                {
                    transaction.tokenCurrency === lpTokenSymbol
                    && isExternalLpToken === true
                        ? nullMessage
                        : parseCurrencyBillions(transaction.tvExec)
                }
            </div>

            {!isActionTable ? (
                <>
                    <div className="list__cell list__cell--right">
                        <span ref={lpTokenRef}>
                            {intl.formatMessage({
                                id: 'FARMING_TOKEN',
                            }, {
                                amount: amountOrZero(transaction.tokenExec, 0),
                                symbol: transaction.tokenCurrency,
                            })}
                        </span>
                    </div>
                    {
                        transaction.tokenCurrency === lpTokenSymbol
                        && transaction.leftExec
                        && transaction.rightExec
                        && (
                            <Tooltip target={lpTokenRef} alignX="right">
                                {intl.formatMessage({
                                    id: 'FARMING_TOKEN',
                                }, {
                                    amount: amountOrZero(transaction.leftExec, 0),
                                    symbol: leftTokenSymbol,
                                })}
                                <br />
                                {intl.formatMessage({
                                    id: 'FARMING_TOKEN',
                                }, {
                                    amount: amountOrZero(transaction.rightExec, 0),
                                    symbol: rightTokenSymbol,
                                })}
                            </Tooltip>
                        )
                    }
                </>
            ) : (
                <>
                    <div className="list__cell list__cell--right">
                        {
                            transaction.leftExec && leftTokenSymbol
                                ? intl.formatMessage({
                                    id: 'FARMING_TOKEN',
                                }, {
                                    amount: amountOrZero(transaction.leftExec, 0),
                                    symbol: leftTokenSymbol,
                                })
                                : nullMessage
                        }
                    </div>
                    <div className="list__cell list__cell--right">
                        {
                            transaction.rightExec && rightTokenSymbol
                                ? intl.formatMessage({
                                    id: 'FARMING_TOKEN',
                                }, {
                                    amount: amountOrZero(transaction.rightExec, 0),
                                    symbol: rightTokenSymbol,
                                })
                                : nullMessage
                        }
                    </div>
                    <div className="list__cell list__cell--right">
                        {
                            transaction.tokenExec
                            && intl.formatMessage({
                                id: 'FARMING_TOKEN',
                            }, {
                                amount: amountOrZero(transaction.tokenExec, 0),
                                symbol: transaction.tokenCurrency,
                            })
                        }
                    </div>
                </>
            )}

            <div className="list__cell list__cell--right">
                <AccountExplorerLink address={transaction.userAddress} />
            </div>

            <div className="list__cell list__cell--right">
                {DateTime.fromMillis(transaction.timestampBlock).toRelative()}
            </div>
        </div>
    )
}
