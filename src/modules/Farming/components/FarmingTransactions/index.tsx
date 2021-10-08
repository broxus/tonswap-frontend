import * as React from 'react'
import { useIntl } from 'react-intl'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'

import { Tabs } from '@/components/common/Tabs'
import { Checkbox } from '@/components/common/Checkbox'
import { ContentLoader } from '@/components/common/ContentLoader'
import { PanelLoader } from '@/components/common/PanelLoader'
import { OrderingSwitcher } from '@/components/common/OrderingSwitcher'
import { Pagination } from '@/components/common/Pagination'
import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { EventType, Transaction, TransactionsOrdering } from '@/modules/Farming/types'
import { useApi } from '@/modules/Farming/hooks/useApi'
import { usePagination } from '@/hooks/usePagination'
import { amountOrZero, error, parseCurrencyBillions } from '@/utils'

import './index.scss'

const LIMIT = 10

type Props = {
    poolAddress: string;
    userAddress?: string;
    lpTokenSymbol: string;
    isExternalLpToken: boolean;
}

export function FarmingTransactionsInner({
    poolAddress,
    userAddress,
    lpTokenSymbol,
    isExternalLpToken,
}: Props): JSX.Element {
    const api = useApi()
    const intl = useIntl()
    const pagination = usePagination()
    const [loading, setLoading] = React.useState(true)
    const [transactions, setTransactions] = React.useState<Transaction[]>([])
    const [totalCount, setTotalCount] = React.useState(0)
    const [eventTypes, setEventTypes] = React.useState<EventType[]>(['deposit', 'withdraw', 'claim', 'rewarddeposit'])
    const [ordering, setOrdering] = React.useState<TransactionsOrdering>('blocktimedescending')
    const [onlyUser, setOnlyUser] = React.useState(false)
    const totalPages = Math.ceil(totalCount / LIMIT)
    const { currentPage } = pagination

    const getData = async () => {
        setLoading(true)
        try {
            const data = await api.transactions({}, {}, {
                ordering,
                poolAddress,
                limit: LIMIT,
                offset: currentPage > 0 ? (currentPage - 1) * LIMIT : 0,
                eventTypes: eventTypes.length ? eventTypes : undefined,
                userAddress: onlyUser ? userAddress : undefined,
            })
            setTransactions(data.transactions)
            setTotalCount(data.totalCount)
        }
        catch (e) {
            error(e)
        }
        setLoading(false)
    }

    const clickTabFn = (events: EventType[]) => () => {
        setEventTypes(events)
    }

    React.useEffect(() => {
        pagination.onSubmit(1)
    }, [eventTypes, onlyUser])

    React.useEffect(() => {
        getData()
    }, [currentPage, eventTypes, ordering, onlyUser])

    return (
        <div className="farming-transactions">
            <div className="farming-transactions__head">
                <Tabs
                    items={[{
                        label: intl.formatMessage({
                            id: 'FARMING_TRANSACTIONS_TAB_ALL',
                        }),
                        active: eventTypes.length === 4,
                        onClick: clickTabFn(['deposit', 'withdraw', 'claim', 'rewarddeposit']),
                    }, {
                        label: intl.formatMessage({
                            id: 'FARMING_TRANSACTIONS_TAB_CLAIMS',
                        }),
                        active: eventTypes.length === 1 && eventTypes.includes('claim'),
                        onClick: clickTabFn(['claim']),
                    }, {
                        label: intl.formatMessage({
                            id: 'FARMING_TRANSACTIONS_TAB_DEPOSITS',
                        }),
                        active: eventTypes.length === 1 && eventTypes.includes('deposit'),
                        onClick: clickTabFn(['deposit']),
                    }, {
                        label: intl.formatMessage({
                            id: 'FARMING_TRANSACTIONS_TAB_WITHDRAW',
                        }),
                        active: eventTypes.length === 1 && eventTypes.includes('withdraw'),
                        onClick: clickTabFn(['withdraw']),
                    }, {
                        label: intl.formatMessage({
                            id: 'FARMING_TRANSACTIONS_TAB_REWARD',
                        }),
                        active: eventTypes.length === 1 && eventTypes.includes('rewarddeposit'),
                        onClick: clickTabFn(['rewarddeposit']),
                    }]}
                />

                {userAddress && (
                    <Checkbox
                        label="Only my transactions"
                        onChange={setOnlyUser}
                        checked={onlyUser}
                    />
                )}
            </div>

            <div className="card card--small card--flat">
                <div className="farming-transactions__list list">
                    <div className="list__header">
                        <div className="list__cell list__cell--left">
                            {intl.formatMessage({
                                id: 'FARMING_TRANSACTIONS_COL_TRANSACTION',
                            })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({
                                id: 'FARMING_TRANSACTIONS_COL_VALUE',
                            })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({
                                id: 'FARMING_TRANSACTIONS_COL_TOKEN',
                            })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({
                                id: 'FARMING_TRANSACTIONS_COL_ACCOUNT',
                            })}
                        </div>
                        <div className="list__cell list__cell--right">
                            <OrderingSwitcher<TransactionsOrdering>
                                ascending="blocktimeascending"
                                descending="blocktimedescending"
                                value={ordering}
                                onSwitch={setOrdering}
                            >
                                {intl.formatMessage({
                                    id: 'FARMING_TRANSACTIONS_COL_TIME',
                                })}
                            </OrderingSwitcher>
                        </div>
                    </div>

                    {loading && transactions.length === 0 ? (
                        <div className="farming-transactions__message">
                            <ContentLoader slim />
                        </div>
                    ) : (
                        <>
                            {!loading && transactions.length === 0 ? (
                                <div className="farming-transactions__message">
                                    {intl.formatMessage({
                                        id: 'TRANSACTIONS_LIST_NO_TRANSACTIONS',
                                    })}
                                </div>
                            ) : (
                                <PanelLoader loading={loading && transactions.length > 0}>
                                    {/* eslint-disable react/no-array-index-key */}
                                    {transactions.map((transaction, index) => (
                                        <div className="list__row" key={index}>
                                            <div className="list__cell list__cell--left">
                                                {transaction.kind}
                                            </div>
                                            <div className="list__cell list__cell--right">
                                                {
                                                    transaction.tokenCurrency === lpTokenSymbol
                                                    && isExternalLpToken === true
                                                        ? intl.formatMessage({
                                                            id: 'TRANSACTIONS_LIST_NULL',
                                                        })
                                                        : parseCurrencyBillions(transaction.tvExec)
                                                }
                                            </div>
                                            <div className="list__cell list__cell--right">
                                                {intl.formatMessage({
                                                    id: 'FARMING_TOKEN',
                                                }, {
                                                    amount: amountOrZero(transaction.tokenExec, 0),
                                                    symbol: transaction.tokenCurrency,
                                                })}
                                            </div>
                                            <div className="list__cell list__cell--right">
                                                <AccountExplorerLink address={transaction.userAddress} />
                                            </div>
                                            <div className="list__cell list__cell--right">
                                                {DateTime.fromMillis(transaction.timestampBlock).toRelative()}
                                            </div>
                                        </div>
                                    ))}
                                </PanelLoader>
                            )}
                        </>
                    )}
                </div>

                {pagination && totalPages > 1 && (
                    <Pagination
                        {...pagination}
                        totalPages={totalPages}
                    />
                )}
            </div>
        </div>
    )
}

export const FarmingTransactions = observer(FarmingTransactionsInner)
