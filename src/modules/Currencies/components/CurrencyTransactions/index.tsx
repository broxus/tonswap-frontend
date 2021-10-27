import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { useCurrencyStore } from '@/modules/Currencies/providers/CurrencyStoreProvider'
import { TransactionsList } from '@/modules/Transactions/components'
import { EventTypeFilter, TransactionsOrdering } from '@/modules/Transactions/types'


/* eslint-disable jsx-a11y/anchor-is-valid */
function Transactions(): JSX.Element {
    const intl = useIntl()
    const store = useCurrencyStore()

    const onNextPage = async () => {
        if (store.transactionsCurrentPage < store.transactionsTotalPages) {
            store.changeState('transactionsCurrentPage', store.transactionsCurrentPage + 1)
            await store.loadTransactions()
        }
    }

    const onPrevPage = async () => {
        if (store.transactionsCurrentPage > 1) {
            store.changeState('transactionsCurrentPage', store.transactionsCurrentPage - 1)
            await store.loadTransactions()
        }
    }

    const onChangePage = async (value: number) => {
        store.changeState('transactionsCurrentPage', value)
        await store.loadTransactions()
    }

    const onSwitchOrdering = async (value: TransactionsOrdering) => {
        store.changeState('transactionsOrdering', value)
        store.changeState('transactionsCurrentPage', 1)
        await store.loadTransactions()
    }

    const onSwitchEvent = (value: EventTypeFilter) => async () => {
        if (value === 'all') {
            store.changeState('transactionsEventsType', [])
        }
        else if (value === 'swaps') {
            store.changeState('transactionsEventsType', ['swaplefttoright', 'swaprighttoleft'])
        }
        else if (value === 'deposit') {
            store.changeState('transactionsEventsType', ['deposit'])
        }
        else if (value === 'withdraw') {
            store.changeState('transactionsEventsType', ['withdraw'])
        }
        store.changeState('transactionsCurrentPage', 1)
        await store.loadTransactions()
    }

    return (
        <section className="section">
            <header className="section__header">
                <h2 className="section-title">
                    {intl.formatMessage({
                        id: 'CURRENCY_TRANSACTIONS_LIST_HEADER_TITLE',
                    })}
                </h2>
                <div className="section__header-actions">
                    <ul className="tabs">
                        <li
                            className={classNames({
                                active: store.transactionsEvents.length === 0,
                            })}
                        >
                            <a onClick={onSwitchEvent('all')}>
                                {intl.formatMessage({
                                    id: 'TRANSACTIONS_LIST_EVENT_ALL',
                                })}
                            </a>
                        </li>
                        <li
                            className={classNames({
                                active: (
                                    store.transactionsEvents.length === 2
                                    && store.transactionsEvents.includes('swaplefttoright')
                                    && store.transactionsEvents.includes('swaprighttoleft')
                                ),
                            })}
                        >
                            <a onClick={onSwitchEvent('swaps')}>
                                {intl.formatMessage({
                                    id: 'TRANSACTIONS_LIST_EVENT_SWAPS',
                                })}
                            </a>
                        </li>
                        <li
                            className={classNames({
                                active: (
                                    store.transactionsEvents.length === 1
                                    && store.transactionsEvents.includes('deposit')
                                ),
                            })}
                        >
                            <a onClick={onSwitchEvent('deposit')}>
                                {intl.formatMessage({
                                    id: 'TRANSACTIONS_LIST_EVENT_DEPOSIT',
                                })}
                            </a>
                        </li>
                        <li
                            className={classNames({
                                active: (
                                    store.transactionsEvents.length === 1
                                    && store.transactionsEvents.includes('withdraw')
                                ),
                            })}
                        >
                            <a onClick={onSwitchEvent('withdraw')}>
                                {intl.formatMessage({
                                    id: 'TRANSACTIONS_LIST_EVENT_WITHDRAW',
                                })}
                            </a>
                        </li>
                    </ul>
                </div>
            </header>

            <TransactionsList
                isLoading={store.isTransactionsLoading}
                ordering={store.transactionsOrdering}
                transactions={store.transactions}
                onSwitchOrdering={onSwitchOrdering}
                pagination={{
                    currentPage: store.transactionsCurrentPage,
                    totalPages: store.transactionsTotalPages,
                    onNext: onNextPage,
                    onPrev: onPrevPage,
                    onSubmit: onChangePage,
                }}
            />
        </section>
    )
}

export const CurrencyTransactions = observer(Transactions)
