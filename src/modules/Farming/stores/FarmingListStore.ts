import BigNumber from 'bignumber.js'
import { makeAutoObservable, runInAction, toJS } from 'mobx'
import { Address } from 'ton-inpage-provider'

import { FarmingApi, useApi } from '@/modules/Farming/hooks/useApi'
import {
    FarmingPoolFilter, FarmingPoolsItemResponse, FarmingPoolsRequest,
} from '@/modules/Farming/types'
import { useWallet, WalletService } from '@/stores/WalletService'
import { getImportedTokens, TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import { FavoritePairs, useFavoriteFarmings } from '@/stores/FavoritePairs'
import { error, lastOfCalls } from '@/utils'
import { DexConstants, Farm } from '@/misc'

type Reward = {
    vested: string[];
    entitled: string[];
}

type State = {
    data: FarmingPoolsItemResponse[];
    rewards: Reward[],
    totalPage: number;
    currentPage: number;
    loading: boolean;
    filter: FarmingPoolFilter;
    query: string;
}

const defaultState: State = Object.freeze({
    data: [],
    rewards: [],
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

    protected lastOfFetchData: () => Promise<Promise<[
        FarmingPoolsItemResponse[],
        Reward[],
        number,
    ]> | undefined>

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
        pools: FarmingPoolsItemResponse[],
        total: number,
    }> {
        const result = await this.api.farmingPools({}, {}, this.params())

        return {
            pools: this.favoritePools ? result.favorite_pools_info : result.pools_info,
            total: this.favoritePools ? result.favorite_total_count : result.total_count,
        }
    }

    protected async fetchReward(
        pool: FarmingPoolsItemResponse,
    ): Promise<Reward> {
        if (!this.wallet.address) {
            throw new Error('Wallet must be connected')
        }

        try {
            const userDataAddress = await Farm.userDataAddress(
                new Address(pool.pool_address),
                new Address(this.wallet.address),
            )
            const poolRewardData = await Farm.poolCalculateRewardData(
                new Address(pool.pool_address),
            )
            const reward = await Farm.userPendingReward(
                userDataAddress,
                poolRewardData._accTonPerShare,
                poolRewardData._lastRewardTime,
                `${pool.farm_end_time ? pool.farm_end_time / 1000 : 0}`,
            )
            const vested = reward._vested.map((item, index) => (
                new BigNumber(item).plus(reward._pool_debt[index]).toFixed()
            ))
            const entitled = reward._entitled

            return { vested, entitled }
        }
        catch (e) {
            error(e)
            return {
                vested: [],
                entitled: [],
            }
        }
    }

    protected async fetchRewards(
        pools: FarmingPoolsItemResponse[],
    ): Promise<Reward[]> {
        if (!this.wallet.address) {
            return []
        }

        return Promise.all(pools.map(this.fetchReward))
    }

    protected async fetchData(): Promise<[
        FarmingPoolsItemResponse[],
        Reward[],
        number,
    ]> {
        const { pools, total } = await this.fetchFarmingPools()
        const rewards = await this.fetchRewards(pools)
        const totalPage = Math.ceil(total / PAGE_SIZE)

        return [pools, rewards, totalPage]
    }

    public async getData(): Promise<void> {
        runInAction(() => {
            this.state.loading = true
        })

        const result = await this.lastOfFetchData()

        if (!result) {
            return
        }

        runInAction(() => {
            [
                this.state.data,
                this.state.rewards,
                this.state.totalPage,
            ] = result
            this.state.loading = false
        })

        this.syncTokens()
    }

    public syncTokens(): void {
        this.state.data.forEach(item => {
            if (item.left_address && item.right_address) {
                this.tokensCache.fetchIfNotExist(item.left_address)
                this.tokensCache.fetchIfNotExist(item.right_address)
            }
            else {
                this.tokensCache.fetchIfNotExist(item.token_root_address)
            }
            item.reward_token_root_info.forEach(reward => {
                this.tokensCache.fetchIfNotExist(reward.reward_root_address)
            })
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
        return toJS(this.state.data)
    }

    public get rewards(): Reward[] {
        return toJS(this.state.rewards)
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

    public get filter(): State['filter'] {
        return toJS(this.state.filter)
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
