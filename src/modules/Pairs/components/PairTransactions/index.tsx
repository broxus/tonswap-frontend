import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { usePairStore } from '@/modules/Pairs/providers/PairStoreProvider'
import { TransactionsList } from '@/modules/Transactions/components'
import { EventType, TransactionsOrdering } from '@/modules/Transactions/types'
import { Tabs } from '@/components/common/Tabs'

/* eslint-disable jsx-a11y/anchor-is-valid */
function Transactions(): JSX.Element {
    const intl = useIntl()
    const store = usePairStore()

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

    const onSwitchEvent = async (value: EventType[]) => {
        store.changeState('transactionsEventsType', value)
        store.changeState('transactionsCurrentPage', 1)
        await store.loadTransactions()
    }

    return (
        <section className="section section--large">
            <header className="section__header">
                <h2 className="section-title">
                    {intl.formatMessage({
                        id: 'CURRENCY_TRANSACTIONS_LIST_HEADER_TITLE',
                    })}
                </h2>
                <div className="section__header-actions">
                    <Tabs
                        items={[{
                            label: intl.formatMessage({ id: 'TRANSACTIONS_LIST_EVENT_ALL' }),
                            active: store.transactionsEvents.length === 0,
                            onClick: () => onSwitchEvent([]),
                        }, {
                            label: intl.formatMessage({ id: 'TRANSACTIONS_LIST_EVENT_SWAPS' }),
                            active: store.transactionsEvents.length === 2
                                && store.transactionsEvents.includes('swaplefttoright')
                                && store.transactionsEvents.includes('swaprighttoleft'),
                            onClick: () => onSwitchEvent(['swaplefttoright', 'swaprighttoleft']),
                        }, {
                            label: intl.formatMessage({ id: 'TRANSACTIONS_LIST_EVENT_DEPOSIT' }),
                            active: store.transactionsEvents.length === 1 && store.transactionsEvents.includes('deposit'),
                            onClick: () => onSwitchEvent(['deposit']),
                        }, {
                            label: intl.formatMessage({ id: 'TRANSACTIONS_LIST_EVENT_WITHDRAW' }),
                            active: store.transactionsEvents.length === 1 && store.transactionsEvents.includes('withdraw'),
                            onClick: () => onSwitchEvent(['withdraw']),
                        }]}
                    />
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


export const PairTransactions = observer(Transactions)
