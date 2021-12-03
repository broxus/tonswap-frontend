import * as React from 'react'
import { useIntl } from 'react-intl'

import { SectionTitle } from '@/components/common/SectionTitle'
import { TransactionsList } from '@/modules/Transactions/components'
import { usePagination } from '@/hooks/usePagination'
import { useApi } from '@/modules/Pools/hooks/useApi'
import { EventType, TransactionInfo, TransactionsOrdering } from '@/modules/Transactions/types'
import { Tabs } from '@/components/common/Tabs'
import { error } from '@/utils'

const LIMIT = 10

type Props = {
    poolAddress: string,
    userAddress: string,
}

export function PoolTransactions({
    poolAddress,
    userAddress,
}: Props): JSX.Element {
    const api = useApi()
    const intl = useIntl()
    const pagination = usePagination()
    const [loading, setLoading] = React.useState(true)
    const [transactions, setTransactions] = React.useState<TransactionInfo[]>([])
    const [totalCount, setTotalCount] = React.useState(0)
    const [eventTypes, setEventTypes] = React.useState<EventType[]>(['deposit', 'withdraw'])
    const [ordering, setOrdering] = React.useState<TransactionsOrdering>('blocktimedescending')
    const totalPages = Math.ceil(totalCount / LIMIT)
    const { currentPage } = pagination

    const getData = async () => {
        setLoading(true)
        try {
            const data = await api.transactions({}, {
                body: JSON.stringify({
                    ordering,
                    poolAddress,
                    userAddress,
                    limit: LIMIT,
                    offset: currentPage > 0 ? (currentPage - 1) * LIMIT : 0,
                    eventType: eventTypes.length ? eventTypes : undefined,
                }),
            })
            setTransactions(data.transactions)
            setTotalCount(data.totalCount)
        }
        catch (e) {
            error(e)
        }
        setLoading(false)
    }

    React.useEffect(() => {
        pagination.onSubmit(1)
    }, [eventTypes])

    React.useEffect(() => {
        getData()
    }, [currentPage, eventTypes, ordering])

    return (
        <>
            <div className="pools-sub-header">
                <SectionTitle size="small">
                    {intl.formatMessage({
                        id: 'TRANSACTIONS_LIST_TITLE',
                    })}
                </SectionTitle>

                <Tabs
                    items={[{
                        label: intl.formatMessage({ id: 'TRANSACTIONS_LIST_EVENT_ALL' }),
                        active: eventTypes.length === 2,
                        onClick: () => setEventTypes(['deposit', 'withdraw']),
                    }, {
                        label: intl.formatMessage({ id: 'TRANSACTIONS_LIST_EVENT_DEPOSIT' }),
                        active: eventTypes.length === 1 && eventTypes.includes('deposit'),
                        onClick: () => setEventTypes(['deposit']),
                    }, {
                        label: intl.formatMessage({ id: 'TRANSACTIONS_LIST_EVENT_WITHDRAW' }),
                        active: eventTypes.length === 1 && eventTypes.includes('withdraw'),
                        onClick: () => setEventTypes(['withdraw']),
                    }]}
                />
            </div>

            <TransactionsList
                isLoading={loading}
                ordering={ordering}
                transactions={transactions}
                onSwitchOrdering={setOrdering}
                pagination={{
                    totalPages,
                    currentPage,
                    onNext: pagination.onNext,
                    onPrev: pagination.onPrev,
                    onSubmit: pagination.onSubmit,
                }}
            />
        </>
    )
}
