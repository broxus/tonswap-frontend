import { makeAutoObservable } from 'mobx'

import {
    DEFAULT_PAIRS_STORE_DATA,
    DEFAULT_PAIRS_STORE_STATE,
} from '@/modules/Pairs/constants'
import {
    PairsRequest,
    PairsStoreData,
    PairsStoreState,
} from '@/modules/Pairs/types'
import { PairsApi, usePairsApi } from '@/modules/Pairs/hooks/useApi'
import { getImportedTokens, TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import { DexConstants } from '@/misc'


export class PairsStore {

    /**
     *
     * @protected
     */
    protected data: PairsStoreData = DEFAULT_PAIRS_STORE_DATA

    /**
     *
     * @protected
     */
    protected state: PairsStoreState = DEFAULT_PAIRS_STORE_STATE

    constructor(
        protected readonly tokensCache: TokensCacheService,
        protected readonly api: PairsApi,
    ) {
        makeAutoObservable(this)
    }

    /*
     * External actions for use it in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @param {keyof PairsStoreData} key
     * @param {PairsStoreData[K]} value
     */
    public changeData<K extends keyof PairsStoreData>(key: K, value: PairsStoreData[K]): void {
        this.data[key] = value
    }

    /**
     *
     * @param {keyof PairsStoreState} key
     * @param {PairsStoreState[K]} value
     */
    public changeState<K extends keyof PairsStoreState>(key: K, value: PairsStoreState[K]): void {
        this.state[key] = value
    }

    /**
     *
     */
    public dispose(): void {
        this.data = DEFAULT_PAIRS_STORE_DATA
        this.state = DEFAULT_PAIRS_STORE_STATE
    }

    /**
     *
     */
    public async load(): Promise<void> {
        if (this.isLoading) {
            return
        }

        this.changeState('isLoading', true)

        const body: PairsRequest = {
            currencyAddresses: getImportedTokens(),
            limit: this.limit,
            offset: this.currentPage >= 1 ? (this.currentPage - 1) * this.limit : 0,
            ordering: this.ordering,
            whiteListUri: DexConstants.TokenListURI,
        }
        const result = await this.api.pairs({}, {
            body: JSON.stringify(body),
        })
        this.changeData('pairs', result.pairs)
        this.changeData('totalCount', result.totalCount)
        this.changeState('isLoading', false)
    }

    /*
     * Memoized store data values
     * ----------------------------------------------------------------------------------
     */

    /**
     * @returns {PairsStoreData['pairs']}
     */
    public get pairs(): PairsStoreData['pairs'] {
        return this.data.pairs.filter(({ meta }) => (
            this.tokensCache.roots.includes(meta.baseAddress)
            && this.tokensCache.roots.includes(meta.counterAddress)
        ))
    }

    /*
     * Computed values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get totalPages(): number {
        return Math.ceil(this.data.totalCount / this.limit)
    }

    /*
     * Memoized store state values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get currentPage(): PairsStoreState['currentPage'] {
        return this.state.currentPage
    }

    /**
     *
     */
    public get limit(): PairsStoreState['limit'] {
        return this.state.limit
    }

    /**
     *
     */
    public get isLoading(): PairsStoreState['isLoading'] {
        return this.state.isLoading
    }

    /**
     *
     */
    public get ordering(): PairsStoreState['ordering'] {
        return this.state.ordering
    }

}


const Pairs = new PairsStore(useTokensCache(), usePairsApi())

export function usePairsStore(): PairsStore {
    return Pairs
}
