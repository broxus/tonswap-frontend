import * as React from 'react'

import { PoolFarmings as PoolFarmingsCommon, PoolFarmingsProps } from '@/modules/Farming/components/PoolFarmings'
import { usePagination } from '@/hooks/usePagination'

type Props = {
    items: PoolFarmingsProps['items']
}

const PAGE_SIZE = 10

export function PoolFarmings({
    items,
}: Props): JSX.Element | null {
    const pagination = usePagination()
    const totalPages = Math.ceil(items.length / PAGE_SIZE)
    const startIndex = PAGE_SIZE * (pagination.currentPage - 1)
    const endIndex = startIndex + PAGE_SIZE
    const visibleItems = items.slice(startIndex, endIndex)

    return (
        <PoolFarmingsCommon
            items={visibleItems}
            totalPages={totalPages}
            onNext={pagination.onNext}
            onPrev={pagination.onPrev}
            currentPage={pagination.currentPage}
            onSubmit={pagination.onSubmit}
        />
    )
}
