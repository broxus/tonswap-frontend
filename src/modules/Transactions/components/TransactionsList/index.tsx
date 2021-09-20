import * as React from 'react'
import { useIntl } from 'react-intl'

import { ContentLoader } from '@/components/common/ContentLoader'
import { OrderingSwitcher } from '@/components/common/OrderingSwitcher'
import { Item } from '@/modules/Transactions/components/TransactionsList/Item'
import { TransactionInfo, TransactionsOrdering } from '@/modules/Transactions/types'
import { Pagination, PaginationProps } from '@/components/common/Pagination'
import { PanelLoader } from '@/components/common/PanelLoader'

import './index.scss'

type Props = {
    isLoading: boolean;
    ordering: TransactionsOrdering | undefined;
    transactions: TransactionInfo[];
    pagination?: PaginationProps;
    onSwitchOrdering: (value: TransactionsOrdering) => void;
}

export function TransactionsList({
    isLoading,
    ordering,
    transactions,
    pagination,
    onSwitchOrdering,
}: Props): JSX.Element {
    const intl = useIntl()

    return (
        <div className="card card--small card--flat">
            <div className="transactions-list list">
                <div className="list__header">
                    <div className="list__cell list__cell--left">
                        {intl.formatMessage({
                            id: 'TRANSACTIONS_LIST_HEADER_TRANSACTION_CELL',
                        })}
                    </div>
                    <div className="list__cell list__cell--right">
                        {intl.formatMessage({
                            id: 'TRANSACTIONS_LIST_HEADER_TOTAL_VALUE_CELL',
                        })}
                    </div>
                    <div className="list__cell list__cell--right hide-824">
                        {intl.formatMessage({
                            id: 'TRANSACTIONS_LIST_HEADER_LEFT_TOKEN_CELL',
                        })}
                    </div>
                    <div className="list__cell list__cell--right hide-824">
                        {intl.formatMessage({
                            id: 'TRANSACTIONS_LIST_HEADER_RIGHT_TOKEN_CELL',
                        })}
                    </div>
                    <div className="list__cell list__cell--right hide-824">
                        {intl.formatMessage({
                            id: 'TRANSACTIONS_LIST_HEADER_ACCOUNT_CELL',
                        })}
                    </div>
                    <div className="list__cell list__cell--right hide-540">
                        <OrderingSwitcher<TransactionsOrdering>
                            ascending="blocktimeascending"
                            descending="blocktimedescending"
                            value={ordering}
                            onSwitch={onSwitchOrdering}
                        >
                            {intl.formatMessage({
                                id: 'TRANSACTIONS_LIST_HEADER_TIME_CELL',
                            })}
                        </OrderingSwitcher>
                    </div>
                </div>

                {isLoading && transactions.length === 0 ? (
                    <ContentLoader />
                ) : (
                    <>
                        {!isLoading && transactions.length === 0 ? (
                            <div className="message message_faded">
                                <p>{intl.formatMessage({ id: 'TRANSACTIONS_LIST_NO_TRANSACTIONS' })}</p>
                            </div>
                        ) : (
                            <PanelLoader loading={isLoading && transactions.length > 0}>
                                {transactions.map(transaction => (
                                    <Item
                                        key={Object.values(transaction).join('-')}
                                        transaction={transaction}
                                    />
                                ))}
                            </PanelLoader>
                        )}
                    </>
                )}
            </div>

            {pagination && pagination.totalPages > 1 && (
                <Pagination {...pagination} />
            )}
        </div>
    )
}
