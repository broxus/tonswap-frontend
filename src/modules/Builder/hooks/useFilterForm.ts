import * as React from 'react'
import { BuilderStoreData } from '@/modules/Builder/types'
import { useBuilderStore } from '@/modules/Builder/stores/BuilderStore'
import { debounce } from '@/utils'

type FilterFormShape = {
    onChangeData: <K extends keyof BuilderStoreData>(key: K) => (value: BuilderStoreData[K]) => void;
    debouncedFilter: () => void;
}

export function useFilterForm(): FilterFormShape {
    const builder = useBuilderStore()

    const onChangeData = <K extends keyof BuilderStoreData>(key: K) => (value: BuilderStoreData[K]) => {
        builder.changeData(key, value)
    }

    const debouncedFilter = debounce(async () => {
        await builder.filterTokens()
    }, 500)

    React.useEffect(() => {
        builder.init()

        return () => {
            builder.dispose()
        }
    })

    return { onChangeData, debouncedFilter }
}
