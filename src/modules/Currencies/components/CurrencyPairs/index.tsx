import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Pagination } from '@/components/common/Pagination'
import { PairsList } from '@/modules/Pairs/components'
import { useCurrencyStore } from '@/modules/Currencies/providers/CurrencyStoreProvider'
import { PairsOrdering } from '@/modules/Pairs/types'


function Pairs(): JSX.Element {
    const intl = useIntl()
    const store = useCurrencyStore()

    const onNextPage = async () => {
        if (store.pairsCurrentPage < store.pairsTotalPages) {
            store.changeState('pairsCurrentPage', store.pairsCurrentPage + 1)
            await store.loadPairs()
        }
    }

    const onPrevPage = async () => {
        if (store.pairsCurrentPage > 1) {
            store.changeState('pairsCurrentPage', store.pairsCurrentPage - 1)
            await store.loadPairs()
        }
    }

    const onChangePage = async (value: number) => {
        store.changeState('pairsCurrentPage', value)
        await store.loadPairs()
    }

    const onSwitchOrdering = async (value: PairsOrdering) => {
        store.changeState('pairsOrdering', value)
        store.changeState('pairsCurrentPage', 1)
        await store.loadPairs()
    }

    return (
        <section className="section">
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
                    onSwitchOrdering={onSwitchOrdering}
                />

                <Pagination
                    currentPage={store.pairsCurrentPage}
                    totalPages={store.pairsTotalPages}
                    onNext={onNextPage}
                    onPrev={onPrevPage}
                    onSubmit={onChangePage}
                />
            </div>
        </section>
    )
}

export const CurrencyPairs = observer(Pairs)
