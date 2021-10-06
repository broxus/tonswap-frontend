import { makeAutoObservable, runInAction } from 'mobx'
import { Address } from 'ton-inpage-provider'

import { FarmingApi, useApi } from '@/modules/Farming/hooks/useApi'
import {
    FarmingPoolFilter, FarmingPoolInfo, FarmingPoolsRequest,
} from '@/modules/Farming/types'
import { getFarmBalance } from '@/modules/Farming/utils'
import { useWallet, WalletService } from '@/stores/WalletService'
import { getImportedTokens, TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import { FavoritePairs, useFavoriteFarmings } from '@/stores/FavoritePairs'
import { lastOfCalls } from '@/utils'
import { DexConstants } from '@/misc'

type RewardInfo = {
    amount: string;
    symbol: string;
    address: string;
}

type FarmInfo = {
    info: FarmingPoolInfo;
    reward: RewardInfo[];
}

type State = {
    data: FarmInfo[];
    totalPage: number;
    currentPage: number;
    loading: boolean;
    filter: FarmingPoolFilter;
    query: string;
}

const defaultState: State = Object.freeze({
    data: [],
    totalPage: 1,
    currentPage: 1,
    loading: false,
    filter: {},
    query: '',
})

const PAGE_SIZE = 10
const CURRENCY_DELIMITER = '/'

export class FarmingListStore {

    protected state: State = defaultState

    protected lastOfFetchData: () => Promise<Promise<[FarmInfo[], number]> | undefined>

    constructor(
        protected api: FarmingApi,
        protected wallet: WalletService,
        protected tokensCache: TokensCacheService,
        protected favoritePairs?: FavoritePairs,
    ) {
        this.lastOfFetchData = lastOfCalls(this.fetchData.bind(this))

        makeAutoObservable(this, {}, { autoBind: true })
    }

    protected params(): FarmingPoolsRequest {
        const { filter, currentPage, query } = this.state
        const [leftCurrency, rightCurrency] = query
            .toUpperCase()
            .split(CURRENCY_DELIMITER)

        return {
            limit: PAGE_SIZE,
            offset: PAGE_SIZE * (currentPage - 1),
            ordering: 'aprdescending',
            aprGe: filter.aprFrom ? filter.aprFrom : undefined,
            aprLe: filter.aprTo ? filter.aprTo : undefined,
            tvlGe: filter.tvlFrom ? filter.tvlFrom : undefined,
            tvlLe: filter.tvlTo ? filter.tvlTo : undefined,
            userAddress: this.wallet.address,
            isAwaitingStart: filter.state === 'awaiting' ? true : undefined,
            isWithMyFarming: filter.ownerInclude,
            leftAddress: filter.leftRoot,
            rightAddress: filter.rightRoot,
            leftCurrency: leftCurrency || undefined,
            rightCurrency: rightCurrency || undefined,
            isActive: (filter.state === 'active' ? true : undefined)
                || (filter.state === 'noActive' ? false : undefined),
            favoritePoolAddresses: this.favoritePools,
            whiteCurrencyAddresses: getImportedTokens(),
            whiteListUri: DexConstants.TokenListURI,
            isLowBalance: this.favoritePairs ? true : (filter.isLowBalance || false),
        }
    }

    protected async fetchFarmingPools(): Promise<{
        pools: FarmingPoolInfo[],
        total: number,
    }> {
        const result = await this.api.farmingPools({}, {}, this.params())

        return {
            pools: this.favoritePools ? result.favorite_pools_info : result.pools_info,
            total: this.favoritePools ? result.favorite_total_count : result.total_count,
        }
    }

    protected async fetchData(): Promise<[FarmInfo[], number]> {
        const { pools, total } = await this.fetchFarmingPools()

        const rewards = await Promise.all(
            pools.map(item => (
                getFarmBalance(
                    new Address(item.pool_address),
                    new Address(this.wallet.address as string),
                    item.reward_token_root_info.map(tokenInfo => ({
                        symbol: tokenInfo.reward_currency,
                        scale: tokenInfo.reward_scale,
                        address: tokenInfo.reward_root_address,
                    })),
                    item.farm_end_time,
                )
            )),
        )

        const farmInfos = pools.map((info, index) => ({
            info,
            reward: rewards[index],
        }))
        const totalPage = Math.ceil(total / PAGE_SIZE)

        return [farmInfos, totalPage]
    }

    public async getData(): Promise<void> {
        if (!this.wallet.address) {
            throw new Error('Wallet must be connected')
        }

        runInAction(() => {
            this.state.loading = true
        })

        const result = await this.lastOfFetchData()

        if (!result) {
            return
        }

        const tokensRoots = FarmingListStore.getTokensRoots(result[0])
        tokensRoots.forEach(root => this.tokensCache.fetchIfNotExist(root))

        runInAction(() => {
            [this.state.data, this.state.totalPage] = result
            this.state.loading = false
        })
    }

    public nextPage(): void {
        this.state.currentPage += 1
        this.getData()
    }

    public prevPage(): void {
        this.state.currentPage -= 1
        this.getData()
    }

    public submitPage(page: number): void {
        this.state.currentPage = page
        this.getData()
    }

    public changeFilter(filter: FarmingPoolFilter): void {
        this.state.filter = filter
        this.state.currentPage = 1
        this.getData()
    }

    public changeQuery(value: string): void {
        this.state.query = value
        this.state.currentPage = 1
        this.getData()
    }

    public dispose(): void {
        this.state = defaultState
    }

    public get data(): State['data'] {
        return this.state.data
    }

    public get loading(): State['loading'] {
        return this.state.loading
    }

    public get totalPages(): State['totalPage'] {
        return this.state.totalPage
    }

    public get currentPage(): State['currentPage'] {
        return this.state.currentPage
    }

    public get query(): State['query'] {
        return this.state.query
    }

    public get favoritePools(): string[] | undefined {
        if (!this.favoritePairs || !this.favoritePairs.isConnected) {
            return undefined
        }

        return this.favoritePairs.addresses
    }

    static getTokensRoots(poolsInfo: FarmInfo[]): string[] {
        const roots = poolsInfo.reduce<string[]>((acc, item) => {
            if (item.info.left_address && item.info.right_address) {
                acc.push(item.info.left_address)
                acc.push(item.info.right_address)
            }
            else {
                acc.push(item.info.token_root_address)
            }
            item.reward.forEach(({ address }) => {
                acc.push(address)
            })
            return acc
        }, [])

        return [...new Set(roots)]
    }

}

const farmingListStore = new FarmingListStore(
    useApi(),
    useWallet(),
    useTokensCache(),
)

const favoriteFarmingListStore = new FarmingListStore(
    useApi(),
    useWallet(),
    useTokensCache(),
    useFavoriteFarmings(),
)

export function useFarmingListStore(): FarmingListStore {
    return farmingListStore
}

export function useFavoriteFarmingListStore(): FarmingListStore {
    return favoriteFarmingListStore
}
