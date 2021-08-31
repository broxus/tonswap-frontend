import { makeAutoObservable } from 'mobx'

import {
    DEFAULT_CURRENCIES_STORE_DATA,
    DEFAULT_CURRENCIES_STORE_STATE,
} from '@/modules/Currencies/constants'
import {
    CurrenciesRequest,
    CurrenciesStoreData,
    CurrenciesStoreState,
} from '@/modules/Currencies/types'
import { getImportedTokens, TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import { DexConstants } from '@/misc'
import { CurrenciesApi, useCurrenciesApi } from '@/modules/Currencies/hooks/useApi'


export class CurrenciesStore {

    /**
     *
     * @protected
     */
    protected data: CurrenciesStoreData = DEFAULT_CURRENCIES_STORE_DATA

    /**
     *
     * @protected
     */
    protected state: CurrenciesStoreState = DEFAULT_CURRENCIES_STORE_STATE

    constructor(
        protected readonly tokensCache: TokensCacheService,
        protected readonly api: CurrenciesApi,
    ) {
        makeAutoObservable(this)
    }

    /*
     * External actions for use it in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @param {keyof CurrenciesStoreData} key
     * @param {CurrenciesStoreData[K]} value
     */
    public changeData<K extends keyof CurrenciesStoreData>(key: K, value: CurrenciesStoreData[K]): void {
        this.data[key] = value
    }

    /**
     *
     * @param {keyof CurrenciesStoreState} key
     * @param {CurrenciesStoreState[K]} value
     */
    public changeState<K extends keyof CurrenciesStoreState>(key: K, value: CurrenciesStoreState[K]): void {
        this.state[key] = value
    }

    public dispose(): void {
        this.data = DEFAULT_CURRENCIES_STORE_DATA
        this.state = DEFAULT_CURRENCIES_STORE_STATE
    }

    /**
     *
     */
    public async load(): Promise<void> {
        if (this.isLoading) {
            return
        }

        this.changeState('isLoading', true)

        const body: CurrenciesRequest = {
            currencyAddresses: getImportedTokens(),
            limit: this.limit,
            offset: this.currentPage >= 1 ? (this.currentPage - 1) * this.limit : 0,
            ordering: this.ordering,
            whiteListUri: DexConstants.TokenListURI,
        }

        const result = await this.api.currencies({}, {
            body: JSON.stringify(body),
        })
        this.changeData('currencies', result.currencies)
        this.changeData('totalCount', result.totalCount)
        this.changeState('isLoading', false)
    }

    /*
     * Memoized store data values
     * ----------------------------------------------------------------------------------
     */

    /**
     * @returns {CurrenciesStoreData['currencies']}
     */
    public get currencies(): CurrenciesStoreData['currencies'] {
        return this.data.currencies.filter(
            currency => this.tokensCache.roots.includes(currency.address),
        )
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
    public get currentPage(): CurrenciesStoreState['currentPage'] {
        return this.state.currentPage
    }

    /**
     *
     */
    public get limit(): CurrenciesStoreState['limit'] {
        return this.state.limit
    }

    /**
     *
     */
    public get isLoading(): CurrenciesStoreState['isLoading'] {
        return this.state.isLoading
    }

    /**
     *
     */
    public get ordering(): CurrenciesStoreState['ordering'] {
        return this.state.ordering
    }

}


const Currencies = new CurrenciesStore(useTokensCache(), useCurrenciesApi())

export function useCurrenciesStore(): CurrenciesStore {
    return Currencies
}
