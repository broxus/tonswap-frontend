import * as React from 'react'
import { useIntl } from 'react-intl'

import { SectionTitle } from '@/components/common/SectionTitle'
import { FarmingTable, FarmingTableProps } from '@/modules/Farming/components/FarmingTable'
import { usePagination } from '@/hooks/usePagination'

type Props = {
    items: FarmingTableProps['items']
}

const PAGE_SIZE = 10

export function PoolFarmings({
    items,
}: Props): JSX.Element | null {
    const intl = useIntl()
    const pagination = usePagination()
    const totalPages = Math.ceil(items.length / PAGE_SIZE)
    const startIndex = PAGE_SIZE * (pagination.currentPage - 1)
    const endIndex = startIndex + PAGE_SIZE
    const visibleItems = items.slice(startIndex, endIndex)

    return (
        <>
            <div className="pools-sub-header">
                <SectionTitle size="small">
                    {intl.formatMessage({ id: 'POOLS_FARMINGS_TITLE' })}
                </SectionTitle>
            </div>

            <FarmingTable
                items={visibleItems}
                totalPages={totalPages}
                onNext={pagination.onNext}
                onPrev={pagination.onPrev}
                currentPage={pagination.currentPage}
                onSubmit={pagination.onSubmit}
            />
        </>
    )
}
