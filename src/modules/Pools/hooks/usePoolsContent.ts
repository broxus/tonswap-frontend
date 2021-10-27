import * as React from 'react'
import BigNumber from 'bignumber.js'
import { Address } from 'ton-inpage-provider'
import { useIntl } from 'react-intl'

import { useDexBalances } from '@/modules/Pools/hooks/useDexBalances'
import { FarmingPoolsItemResponse } from '@/modules/Farming/types'
import { useFavoritePairs } from '@/stores/FavoritePairs'
import { useWallet } from '@/stores/WalletService'
import { useTokensList } from '@/stores/TokensListService'
import { useTokensCache } from '@/stores/TokensCacheService'
import { usePagination } from '@/hooks/usePagination'
import { useApi } from '@/modules/Pools/hooks/useApi'
import { ItemProps } from '@/modules/Pools/components/PoolsContent/item'
import {
    concatSymbols, debounce, error,
    formattedAmount, lastOfCalls, shareAmount,
} from '@/utils'
import { Pool, PoolData } from '@/misc'
import { appRoutes } from '@/routes'

type UsePoolsContent = {
    loading: boolean;
    items: ItemProps[];
    query: string;
    totalPages: number;
    currentPage: number;
    onSearch: (value: string) => void;
    onSubmit: (page: number) => void;
    onNext: () => void;
    onPrev: () => void;
}

type LockedLp = Record<string, string>

const PAGE_LENGTH = 10

export function usePoolsContent(): UsePoolsContent {
    const intl = useIntl()
    const api = useApi()
    const wallet = useWallet()
    const dexBalances = useDexBalances()
    const tokensList = useTokensList()
    const pagination = usePagination()
    const favoritePairs = useFavoritePairs()
    const tokensCache = useTokensCache()
    const [query, setQuery] = React.useState('')
    const [loading, setLoading] = React.useState(true)
    const [data, setData] = React.useState<PoolData[]>([])
    const [totalPages, setTotalPages] = React.useState(1)
    const [lockedLp, setLockedLp] = React.useState<LockedLp>({})
    const startIndex = PAGE_LENGTH * (pagination.currentPage - 1)
    const endIndex = startIndex + PAGE_LENGTH

    const items = React.useMemo(() => (
        (data
            .map(({
                address, lp, left, right,
            }) => {
                const leftToken = tokensCache.get(left.address)
                const rightToken = tokensCache.get(right.address)

                if (!leftToken || !rightToken) {
                    return undefined
                }

                const lpTokens = new BigNumber(lp.inWallet)
                    .plus(lockedLp[lp.address] || '0')
                    .toFixed()

                return {
                    lpTokens: formattedAmount(lpTokens, lp.decimals),
                    leftToken: intl.formatMessage({
                        id: 'POOLS_LIST_TOKEN_BALANCE',
                    }, {
                        value: shareAmount(
                            lpTokens,
                            left.inPool,
                            lp.inPool,
                            leftToken.decimals,
                        ),
                        symbol: leftToken.symbol,
                    }),
                    rightToken: intl.formatMessage({
                        id: 'POOLS_LIST_TOKEN_BALANCE',
                    }, {
                        value: shareAmount(
                            lpTokens,
                            right.inPool,
                            lp.inPool,
                            rightToken.decimals,
                        ),
                        symbol: rightToken.symbol,
                    }),
                    link: appRoutes.poolItem.makeUrl({ address }),
                    pair: {
                        pairLabel: concatSymbols(
                            tokensCache.get(left.address)?.symbol,
                            tokensCache.get(right.address)?.symbol,
                        ),
                        pairIcons: {
                            leftToken: {
                                address: left.address,
                                uri: tokensList.getUri(left.address),
                            },
                            rightToken: {
                                address: right.address,
                                uri: tokensList.getUri(right.address),
                            },
                        },
                    },
                }
            })
            .filter(item => item !== undefined) as ItemProps[])
    ), [data, tokensList])

    const getFarmingPools = async (
        userAddress: string,
        limit: number = 100,
    ): Promise<FarmingPoolsItemResponse[]> => {
        const { total_count, pools_info } = await api.farmingPools({}, {
            body: JSON.stringify({
                limit,
                offset: 0,
                userAddress,
                isWithMyFarming: true,
                ordering: 'tvlascending',
            }),
        })
        let poolsInfo = pools_info.filter(item => (
            item.left_address
            && item.left_currency
            && item.right_address
            && item.right_currency
        ))
        if (total_count > 100) {
            poolsInfo = await getFarmingPools(userAddress, total_count)
        }
        return poolsInfo
    }

    const getLockedLpInFarming = async (userAddress: string) => {
        const farmingPools = await getFarmingPools(userAddress)
        const byRootToken = farmingPools.reduce((acc, item) => {
            acc[item.token_root_address] = acc[item.token_root_address]
                ? new BigNumber(acc[item.token_root_address])
                    .plus(new BigNumber(item.user_token_balance)
                        .shiftedBy(item.token_root_scale))
                    .toFixed()
                : new BigNumber(item.user_token_balance)
                    .shiftedBy(item.token_root_scale)
                    .toFixed()
            return acc
        }, {} as LockedLp)

        return byRootToken
    }

    const fetchData = React.useCallback(
        lastOfCalls(async (
            addresses: Address[],
            userAddress: string,
        ): Promise<[PoolData[], LockedLp]> => {
            const result = await Promise.all([
                Pool.pools(addresses, new Address(userAddress)),
                getLockedLpInFarming(userAddress),
            ])
            await Promise.all(
                result[0].map(pool => Promise.all([
                    tokensCache.fetchIfNotExist(pool.left.address),
                    tokensCache.fetchIfNotExist(pool.right.address),
                ])),
            )
            return result
        }),
        [],
    )

    const getData = async () => {
        if (!wallet.address) {
            return
        }
        setLoading(true)
        try {
            const pairs = favoritePairs.filterData(query)
            const visiblePairs = pairs.slice(startIndex, endIndex)
            const addresses = visiblePairs.map(item => new Address(item.address))
            const newTotalPages = Math.ceil(pairs.length / PAGE_LENGTH) || 1
            if (pagination.currentPage > newTotalPages) {
                pagination.onSubmit(newTotalPages)
                return
            }
            const result = await fetchData(addresses, wallet.address)
            if (!result) {
                return
            }
            setTotalPages(newTotalPages)
            setLockedLp(result[1])
            setData(result[0])
        }
        catch (e) {
            error(e)
        }
        setLoading(false)
    }

    const onSearch = React.useCallback(
        debounce((value: string) => {
            setQuery(value)
        }, 300),
        [setQuery],
    )

    React.useEffect(() => {
        getData()
    }, [
        query,
        dexBalances,
        wallet.address,
        pagination.currentPage,
        favoritePairs.data,
    ])

    return {
        loading,
        items,
        query,
        totalPages,
        currentPage: pagination.currentPage,
        onNext: pagination.onNext,
        onPrev: pagination.onPrev,
        onSubmit: pagination.onSubmit,
        onSearch,
    }
}
