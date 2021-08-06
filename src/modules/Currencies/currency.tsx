import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { Link, NavLink } from 'react-router-dom'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { Icon } from '@/components/common/Icon'
import { Pagination } from '@/components/common/Pagination'
import { TokenIcon } from '@/components/common/TokenIcon'
import { Stats } from '@/modules/Currencies/components/Stats'
import { PairsList } from '@/modules/Pairs/components'
import { useCurrencyStore } from '@/modules/Currencies/providers/CurrencyStoreProvider'
import { PairsOrdering } from '@/modules/Pairs/types'
import { TransactionsList } from '@/modules/Transactions/components'
import { TransactionsOrdering } from '@/modules/Transactions/types'
import { useTokensCache } from '@/stores/TokensCacheService'
import { getChangesDirection, sliceAddress } from '@/utils'

import './currency.scss'


function CurrencyInner(): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const store = useCurrencyStore()

    const token = React.useMemo(() => (
        store.currency?.address ? tokensCache.get(store.currency.address) : undefined
    ), [store.currency?.address, tokensCache.tokens])

    const onPairsNextPage = async () => {
        if (store.pairsCurrentPage < store.pairsTotalPages) {
            store.changeState('pairsCurrentPage', store.pairsCurrentPage + 1)
            await store.loadPairs()
        }
    }

    const onPairsPrevPage = async () => {
        if (store.pairsCurrentPage > 1) {
            store.changeState('pairsCurrentPage', store.pairsCurrentPage - 1)
            await store.loadPairs()
        }
    }

    const onChangePairsPage = async (value: number) => {
        store.changeState('pairsCurrentPage', value)
        await store.loadPairs()
    }

    const onSwitchPairsOrdering = async (value: PairsOrdering) => {
        store.changeState('pairsOrdering', value)
        store.changeState('pairsCurrentPage', 1)
        await store.loadPairs()
    }

    const onTransactionsNextPage = async () => {
        if (store.transactionsCurrentPage < store.transactionsTotalPages) {
            store.changeState('transactionsCurrentPage', store.transactionsCurrentPage + 1)
            await store.loadTransactions()
        }
    }

    const onTransactionsPrevPage = async () => {
        if (store.transactionsCurrentPage > 1) {
            store.changeState('transactionsCurrentPage', store.transactionsCurrentPage - 1)
            await store.loadTransactions()
        }
    }

    const onChangeTransactionsPage = async (value: number) => {
        store.changeState('transactionsCurrentPage', value)
        await store.loadTransactions()
    }

    const onSwitchTransactionsOrdering = async (value: TransactionsOrdering) => {
        store.changeState('transactionsOrdering', value)
        store.changeState('transactionsCurrentPage', 1)
        await store.loadTransactions()
    }

    return (
        <>
            <section className="section section--large">
                <ul className="breadcrumb">
                    <li>
                        <NavLink to="/tokens">
                            {intl.formatMessage({
                                id: 'CURRENCY_BREADCRUMB_ROOT',
                            })}
                        </NavLink>
                    </li>
                    <li>
                        <span>
                            {store.currency?.currency}
                            <span>
                                {sliceAddress(store.currency?.address)}
                            </span>
                        </span>
                    </li>
                </ul>

                <header className="currency-page__header">
                    <div>
                        <div className="currency-page__token">
                            <TokenIcon
                                address={token?.root}
                                className="currency-page__token-icon"
                                name={token?.symbol}
                                small
                                uri={token?.icon}
                            />
                            <div className="currency-page__token-name">
                                {token?.name || store.currency?.currency}
                                <span>
                                    {token?.symbol}
                                </span>
                            </div>
                        </div>
                        <div className="currency-page__price">
                            <div className="currency-page__price-currency-cost">
                                {store.formattedPrice}
                            </div>
                            {store.currency?.priceChange !== undefined && (
                                <div
                                    className={classNames('changes-direction', {
                                        'changes-direction-up': getChangesDirection(store.currency.priceChange) > 0,
                                        'changes-direction-down': getChangesDirection(store.currency.priceChange) < 0,
                                    })}
                                >
                                    {store.currency.priceChange}
                                    %
                                </div>
                            )}
                        </div>
                    </div>
                    {store.currency?.address !== undefined && (
                        <div className="currency-page__header-actions">
                            <AccountExplorerLink
                                address={store.currency?.address}
                                className="btn btn-md btn-icon"
                            >
                                <Icon icon="externalLink" />
                            </AccountExplorerLink>
                            <Link
                                className="btn btn-md btn-dark"
                                to={`/pool/${store.currency?.address}`}
                            >
                                {intl.formatMessage({
                                    id: 'CURRENCY_ADD_LIQUIDITY_BTN_TEXT',
                                })}
                            </Link>
                            <Link
                                className="btn btn-md btn-light"
                                to={`/swap/${store.currency?.address}`}
                            >
                                {intl.formatMessage({
                                    id: 'CURRENCY_TRADE_BTN_TEXT',
                                })}
                            </Link>
                        </div>
                    )}
                </header>

                <Stats />
            </section>

            <section className="section section--large">
                <header className="section__header">
                    <h2 className="section-title">
                        {intl.formatMessage({
                            id: 'CURRENCY_PAIRS_LIST_HEADER_TITLE',
                        })}
                    </h2>
                </header>

                <div className="card card--small card--flat">
                    <PairsList
                        isLoading={store.isPairsLoading}
                        offset={store.pairsLimit * (store.pairsCurrentPage - 1)}
                        ordering={store.pairsOrdering}
                        pairs={store.relatedPairs}
                        onSwitchOrdering={onSwitchPairsOrdering}
                    />

                    <Pagination
                        currentPage={store.pairsCurrentPage}
                        totalPages={store.pairsTotalPages}
                        onNext={onPairsNextPage}
                        onPrev={onPairsPrevPage}
                        onSubmit={onChangePairsPage}
                    />
                </div>
            </section>

            <section className="section section--large">
                <header className="section__header">
                    <h2 className="section-title">
                        {intl.formatMessage({
                            id: 'CURRENCY_TRANSACTIONS_LIST_HEADER_TITLE',
                        })}
                    </h2>
                </header>

                <div className="card card--small card--flat">
                    <TransactionsList
                        isLoading={store.isTransactionsLoading}
                        ordering={store.transactionsOrdering}
                        transactions={store.transactions}
                        onSwitchOrdering={onSwitchTransactionsOrdering}
                    />

                    <Pagination
                        currentPage={store.transactionsCurrentPage}
                        totalPages={store.transactionsTotalPages}
                        onNext={onTransactionsNextPage}
                        onPrev={onTransactionsPrevPage}
                        onSubmit={onChangeTransactionsPage}
                    />
                </div>
            </section>
        </>
    )
}

export const Currency = observer(CurrencyInner)
