import classNames from 'classnames'
import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Tabs } from '@/components/common/Tabs'
import { Checkbox } from '@/components/common/Checkbox'
import { ContentLoader } from '@/components/common/ContentLoader'
import { PanelLoader } from '@/components/common/PanelLoader'
import { OrderingSwitcher } from '@/components/common/OrderingSwitcher'
import { Pagination } from '@/components/common/Pagination'
import { EventType, Transaction, TransactionsOrdering } from '@/modules/Farming/types'
import { useApi } from '@/modules/Farming/hooks/useApi'
import { FarmingTransactionsItem } from '@/modules/Farming/components/FarmingTransactions/item'
import { usePagination } from '@/hooks/usePagination'
import { error } from '@/utils'

import './index.scss'

const LIMIT = 10

type Props = {
    poolAddress: string;
    userAddress?: string;
    lpTokenSymbol: string;
    leftTokenSymbol?: string;
    rightTokenSymbol?: string;
    isExternalLpToken: boolean;
}

export function FarmingTransactionsInner({
    poolAddress,
    userAddress,
    lpTokenSymbol,
    leftTokenSymbol,
    rightTokenSymbol,
    isExternalLpToken,
}: Props): JSX.Element {
    const api = useApi()
    const intl = useIntl()
    const pagination = usePagination()
    const { currentPage } = pagination
    const [loading, setLoading] = React.useState(true)
    const [transactions, setTransactions] = React.useState<Transaction[]>([])
    const [totalCount, setTotalCount] = React.useState(0)
    const [eventType, setEventType] = React.useState<EventType | null>(null)
    const [ordering, setOrdering] = React.useState<TransactionsOrdering>('blocktimedescending')
    const [onlyUser, setOnlyUser] = React.useState(false)
    const [isActionTable, setIsActionTable] = React.useState(false)
    const totalPages = Math.ceil(totalCount / LIMIT)

    const getData = async (event: EventType | null) => {
        setLoading(true)
        try {
            const data = await api.transactions({}, {}, {
                ordering,
                poolAddress,
                limit: LIMIT,
                offset: currentPage > 0 ? (currentPage - 1) * LIMIT : 0,
                eventTypes: event ? [event] : ['claim', 'deposit', 'withdraw', 'rewarddeposit'],
                userAddress: onlyUser ? userAddress : undefined,
            })
            setTransactions(data.transactions)
            setTotalCount(data.totalCount)
            setIsActionTable(event === 'withdraw' || event === 'deposit')
        }
        catch (e) {
            error(e)
        }
        setLoading(false)
    }

    const clickTabFn = (event: EventType | null) => () => {
        setEventType(event)
    }

    React.useEffect(() => {
        pagination.onSubmit(1)
    }, [eventType, onlyUser])

    React.useEffect(() => {
        getData(eventType)
    }, [currentPage, ordering, eventType, onlyUser])

    return (
        <div className="farming-transactions">
            <div className="farming-transactions__head">
                <Tabs
                    items={[{
                        label: intl.formatMessage({
                            id: 'FARMING_TRANSACTIONS_TAB_ALL',
                        }),
                        active: eventType === null,
                        onClick: clickTabFn(null),
                    }, {
                        label: intl.formatMessage({
                            id: 'FARMING_TRANSACTIONS_TAB_CLAIMS',
                        }),
                        active: eventType === 'claim',
                        onClick: clickTabFn('claim'),
                    }, {
                        label: intl.formatMessage({
                            id: 'FARMING_TRANSACTIONS_TAB_DEPOSITS',
                        }),
                        active: eventType === 'deposit',
                        onClick: clickTabFn('deposit'),
                    }, {
                        label: intl.formatMessage({
                            id: 'FARMING_TRANSACTIONS_TAB_WITHDRAW',
                        }),
                        active: eventType === 'withdraw',
                        onClick: clickTabFn('withdraw'),
                    }, {
                        label: intl.formatMessage({
                            id: 'FARMING_TRANSACTIONS_TAB_REWARD',
                        }),
                        active: eventType === 'rewarddeposit',
                        onClick: clickTabFn('rewarddeposit'),
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
                <div
                    className={classNames('farming-transactions__list list', {
                        action: isActionTable,
                    })}
                >
                    <div className="list__header">
                        {!isActionTable && (
                            <div className="list__cell list__cell--left">
                                {intl.formatMessage({
                                    id: 'FARMING_TRANSACTIONS_COL_TYPE',
                                })}
                            </div>
                        )}

                        <div className={`list__cell list__cell--${isActionTable ? 'left' : 'right'}`}>
                            {intl.formatMessage({
                                id: 'FARMING_TRANSACTIONS_COL_VALUE',
                            })}
                        </div>

                        {!isActionTable ? (
                            <div className="list__cell list__cell--right">
                                {intl.formatMessage({
                                    id: 'FARMING_TRANSACTIONS_COL_TOKEN',
                                })}
                            </div>
                        ) : (
                            <>
                                <div className="list__cell list__cell--right">
                                    {intl.formatMessage({
                                        id: 'FARMING_TRANSACTIONS_COL_LEFT',
                                    })}
                                </div>
                                <div className="list__cell list__cell--right">
                                    {intl.formatMessage({
                                        id: 'FARMING_TRANSACTIONS_COL_RIGHT',
                                    })}
                                </div>
                                <div className="list__cell list__cell--right">
                                    {intl.formatMessage({
                                        id: 'FARMING_TRANSACTIONS_COL_LP',
                                    })}
                                </div>
                            </>
                        )}

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
                                        <FarmingTransactionsItem
                                            key={index}
                                            transaction={transaction}
                                            lpTokenSymbol={lpTokenSymbol}
                                            leftTokenSymbol={leftTokenSymbol}
                                            rightTokenSymbol={rightTokenSymbol}
                                            isExternalLpToken={isExternalLpToken}
                                            isActionTable={isActionTable}
                                        />
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
