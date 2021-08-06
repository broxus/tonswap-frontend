import { makeAutoObservable } from 'mobx'

import { API_URL } from '@/constants'
import {
    DEFAULT_CURRENCIES_STORE_DATA,
    DEFAULT_CURRENCIES_STORE_STATE,
} from '@/modules/Currencies/constants'
import {
    CurrenciesRequest,
    CurrenciesResponse,
    CurrenciesStoreData,
    CurrenciesStoreState,
} from '@/modules/Currencies/types'


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

    constructor() {
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
            limit: this.limit,
            offset: this.currentPage >= 1 ? (this.currentPage - 1) * this.limit : 0,
            ordering: this.ordering,
        }
        const response = await fetch(`${API_URL}/currencies`, {
            body: JSON.stringify(body),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'POST',
            mode: 'cors',
        })

        if (response.ok) {
            const result: CurrenciesResponse = await response.json()
            this.changeData('currencies', result.currencies)
            this.changeData('totalCount', result.totalCount)
        }

        this.changeState('isLoading', false)
    }

    /*
     * Memoized store data values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get currencies(): CurrenciesStoreData['currencies'] {
        return this.data.currencies
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


const Currencies = new CurrenciesStore()

export function useCurrenciesStore(): CurrenciesStore {
    return Currencies
}
