import { useHistory, useLocation } from 'react-router-dom'

import { FarmingPoolFilter } from '@/modules/Farming/types'

type LocationFilter = {
    parse: () => FarmingPoolFilter;
    update: (value: FarmingPoolFilter) => void;
}

export function useLocationFilter(prefix: string = ''): LocationFilter {
    const location = useLocation()
    const history = useHistory()

    const addPrefix = (key: string) => (prefix ? `${prefix}-${key}` : key)
    const removePrefix = (key: string) => (prefix ? key.replace(`${prefix}-`, '') : key)
    const hasPrefix = (key: string) => (prefix ? key.indexOf(`${prefix}-`) === 0 : true)

    const parse = () => {
        const searchParams = new URLSearchParams(location.search)
        const params = [...searchParams.entries()]
        const filter = params.reduce<FarmingPoolFilter>((acc, [rawKey, value]) => {
            if (!hasPrefix(rawKey)) {
                return acc
            }

            const key = removePrefix(rawKey)

            switch (key) {
                case 'leftRoot':
                case 'rightRoot':
                case 'tvlFrom':
                case 'tvlTo':
                case 'aprFrom':
                case 'aprTo':
                    acc[key] = value
                    break
                case 'ownerInclude':
                case 'isLowBalance':
                    acc[key] = value === 'true'
                    break
                case 'state':
                    if (value === 'awaiting' || value === 'active' || value === 'noActive') {
                        acc[key] = value
                    }
                    break
                default:
                    break
            }

            return acc
        }, {})

        return filter
    }

    const update = (actualFilter: FarmingPoolFilter) => {
        const searchParams = new URLSearchParams(location.search)
        const currentFilters = parse()

        Object.entries(currentFilters).forEach(item => {
            const rawKey = item[0] as keyof FarmingPoolFilter
            const val = item[1].toString()
            const key = addPrefix(rawKey)

            if (actualFilter[rawKey]) {
                searchParams.set(key, val)
            }
            else {
                searchParams.delete(key)
            }
        })

        Object.entries(actualFilter).forEach(([rawKey, val]) => {
            const key = addPrefix(rawKey)

            if (val === undefined) {
                searchParams.delete(key)
            }
            else {
                searchParams.set(key, val.toString())
            }
        })

        history.replace({ search: searchParams.toString() })
    }

    return { parse, update }
}
