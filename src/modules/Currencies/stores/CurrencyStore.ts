import { Time } from 'lightweight-charts'
import { DateTime } from 'luxon'
import {
    action,
    IReactionDisposer,
    makeAutoObservable,
    reaction,
} from 'mobx'
import uniqBy from 'lodash.uniqby'

import { DexConstants } from '@/misc'
import {
    CandlestickGraphShape,
    CommonGraphShape,
} from '@/modules/Chart/types'
import {
    DEFAULT_CURRENCY_STORE_DATA,
    DEFAULT_CURRENCY_STORE_STATE,
} from '@/modules/Currencies/constants'
import {
    CurrencyGraphRequest,
    CurrencyStoreData,
    CurrencyStoreGraphData,
    CurrencyStoreState,
} from '@/modules/Currencies/types'
import { PairsRequest } from '@/modules/Pairs/types'
import { TransactionsRequest } from '@/modules/Transactions/types'
import { getImportedTokens } from '@/stores/TokensCacheService'
import { parseCurrencyBillions } from '@/utils'
import { CurrenciesApi, useCurrenciesApi } from '@/modules/Currencies/hooks/useApi'


export class CurrencyStore {

    /**
     *
     * @protected
     */
    protected data: CurrencyStoreData = DEFAULT_CURRENCY_STORE_DATA

    /**
     *
     * @protected
     */
    protected state: CurrencyStoreState = DEFAULT_CURRENCY_STORE_STATE

    protected readonly api: CurrenciesApi = useCurrenciesApi()

    constructor(protected readonly address: string) {
        makeAutoObservable(this, {
            loadPricesGraph: action.bound,
            loadTvlGraph: action.bound,
            loadVolumeGraph: action.bound,
        })

        this.#timeframeDisposer = reaction(() => this.timeframe, () => {
            this.changeState('isPricesGraphLoading', false)
            this.changeState('isTvlGraphLoading', false)
            this.changeState('isVolumeGraphLoading', false)
            this.changeData('graphData', DEFAULT_CURRENCY_STORE_DATA.graphData)
        })
    }

    /**
     *
     * @param {keyof CurrencyStoreData} key
     * @param {CurrencyStoreData[K]} value
     */
    public changeData<K extends keyof CurrencyStoreData>(key: K, value: CurrencyStoreData[K]): void {
        this.data[key] = value
    }

    /**
     *
     * @param {keyof CurrencyStoreState} key
     * @param {CurrencyStoreState[K]} value
     */
    public changeState<K extends keyof CurrencyStoreState>(key: K, value: CurrencyStoreState[K]): void {
        this.state[key] = value
    }

    /**
     *
     */
    public dispose(): void {
        this.#timeframeDisposer?.()
    }

    /**
     *
     * @param {keyof CurrencyStoreGraphData} key
     * @param {CurrencyStoreGraphData[K]} value
     * @protected
     */
    protected changeGraphData<K extends keyof CurrencyStoreGraphData>(key: K, value: CurrencyStoreGraphData[K]): void {
        this.data.graphData[key] = value
    }

    /**
     *
     */
    public get isLoading(): CurrencyStoreState['isLoading'] {
        return this.state.isLoading
    }

    /**
     *
     */
    public async load(): Promise<void> {
        if (this.isLoading) {
            return
        }

        try {
            this.changeState('isLoading', true)

            const result = await this.api.currency({
                address: this.address,
            })
            this.changeData('currency', result)
        }
        catch (e) {}
        finally {
            this.changeState('isLoading', false)
        }
    }

    /**
     *
     */
    public get currency(): CurrencyStoreData['currency'] {
        return this.data.currency
    }

    /**
     *
     */
    public get formattedPrice(): string {
        return parseCurrencyBillions(this.currency?.price)
    }

    /**
     *
     */
    public get formattedVolume24h(): string {
        return parseCurrencyBillions(this.currency?.volume24h)
    }

    /**
     *
     */
    public get formattedVolume7d(): string {
        return parseCurrencyBillions(this.currency?.volume7d)
    }

    /**
     *
     */
    public get formattedTvl(): string {
        return parseCurrencyBillions(this.currency?.tvl)
    }

    /**
     *
     */
    public get isPricesGraphLoading(): CurrencyStoreState['isPricesGraphLoading'] {
        return this.state.isPricesGraphLoading
    }

    /**
     *
     * @param {number} [from]
     * @param {number} [to]
     */
    public async loadPricesGraph(from?: number, to?: number): Promise<void> {
        if (this.isPricesGraphLoading) {
            return
        }

        try {
            this.changeState('isPricesGraphLoading', true)

            const body: CurrencyGraphRequest = {
                from: from || DateTime.local().minus({
                    days: this.timeframe === 'D1' ? 30 : 7,
                }).toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
                timeframe: this.timeframe,
                to: to || DateTime.local().toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
            }

            const result = await this.api.currencyPrices({
                address: this.address,
            }, {
                body: JSON.stringify(body),
            })

            this.changeGraphData('prices', result.concat(this.graphData.prices))
        }
        catch (e) {}
        finally {
            this.changeState('isPricesGraphLoading', false)
        }
    }

    /**
     *
     */
    public get isVolumeGraphLoading(): CurrencyStoreState['isVolumeGraphLoading'] {
        return this.state.isVolumeGraphLoading
    }

    /**
     *
     * @param {number} [from]
     * @param {number} [to]
     */
    public async loadVolumeGraph(from?: number, to?: number): Promise<void> {
        if (this.isVolumeGraphLoading) {
            return
        }

        try {
            this.changeState('isVolumeGraphLoading', true)

            const body: CurrencyGraphRequest = {
                from: from || DateTime.local().minus({
                    days: this.timeframe === 'D1' ? 30 : 7,
                }).toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
                timeframe: this.timeframe,
                to: to || DateTime.local().toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
            }

            const result = await this.api.currencyVolume({
                address: this.address,
            }, {
                body: JSON.stringify(body),
            })

            this.changeGraphData('volume', result.concat(this.graphData.volume))
        }
        catch (e) {}
        finally {
            this.changeState('isVolumeGraphLoading', false)
        }
    }

    /**
     *
     */
    public get isTvlGraphLoading(): CurrencyStoreState['isTvlGraphLoading'] {
        return this.state.isTvlGraphLoading
    }

    /**
     *
     * @param {number} [from]
     * @param {number} [to]
     */
    public async loadTvlGraph(from?: number, to?: number): Promise<void> {
        if (this.isTvlGraphLoading) {
            return
        }

        try {
            this.changeState('isTvlGraphLoading', true)

            const body: CurrencyGraphRequest = {
                from: from || DateTime.local().minus({
                    days: this.timeframe === 'D1' ? 30 : 7,
                }).toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
                timeframe: this.timeframe,
                to: to || DateTime.local().toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
            }

            const result = await this.api.currencyTvl({
                address: this.address,
            }, {
                body: JSON.stringify(body),
            })

            this.changeGraphData('tvl', result.concat(this.graphData.tvl))
        }
        catch (e) {}
        finally {
            this.changeState('isTvlGraphLoading', false)
        }
    }

    /**
     *
     */
    public get timeframe(): CurrencyStoreState['timeframe'] {
        return this.state.timeframe
    }

    /**
     *
     */
    public get graph(): CurrencyStoreState['graph'] {
        return this.state.graph
    }

    /**
     *
     */
    public get graphData(): CurrencyStoreData['graphData'] {
        return this.data.graphData
    }

    /**
     *
     */
    public get pricesGraphData(): CandlestickGraphShape[] {
        return this.graphData.prices.map<CandlestickGraphShape>(item => ({
            close: parseFloat(item.close),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            open: parseFloat(item.open),
            time: (item.timestamp / 1000) as Time,
        }))
    }

    /**
     *
     */
    public get volumeGraphData(): CommonGraphShape[] {
        return uniqBy(this.graphData.volume, 'timestamp').map<CommonGraphShape>(item => ({
            time: (item.timestamp / 1000) as Time,
            value: parseFloat(item.data),
        }))
    }

    /**
     *
     */
    public get tvlGraphData(): CommonGraphShape[] {
        return uniqBy(this.graphData.tvl, 'timestamp').map<CommonGraphShape>(item => ({
            time: (item.timestamp / 1000) as Time,
            value: parseFloat(item.data),
        }))
    }

    /**
     *
     */
    public get isPairsLoading(): CurrencyStoreState['isPairsLoading'] {
        return this.state.isPairsLoading
    }

    /**
     *
     */
    public async loadPairs(): Promise<void> {
        if (this.isPairsLoading) {
            return
        }

        try {
            this.changeState('isPairsLoading', true)

            const body: PairsRequest = {
                currencyAddresses: getImportedTokens(),
                currencyAddress: this.address,
                limit: this.pairsLimit,
                offset: this.pairsCurrentPage >= 1 ? (this.pairsCurrentPage - 1) * this.pairsLimit : 0,
                ordering: this.pairsOrdering,
                whiteListUri: DexConstants.TokenListURI,
            }

            const result = await this.api.pairs({}, {
                body: JSON.stringify(body),
            })
            this.changeData('pairsData', result)
        }
        catch (e) {}
        finally {
            this.changeState('isPairsLoading', false)
        }
    }

    /**
     *
     */
    public get relatedPairs(): CurrencyStoreData['pairsData']['pairs'] {
        return this.data.pairsData.pairs
    }

    /**
     *
     */
    public get pairsCurrentPage(): CurrencyStoreState['pairsCurrentPage'] {
        return this.state.pairsCurrentPage
    }

    /**
     *
     */
    public get pairsLimit(): CurrencyStoreState['pairsLimit'] {
        return this.state.pairsLimit
    }

    /**
     *
     */
    public get pairsOrdering(): CurrencyStoreState['pairsOrdering'] {
        return this.state.pairsOrdering
    }

    /**
     *
     */
    public get pairsTotalPages(): CurrencyStoreData['pairsData']['totalCount'] {
        return Math.ceil(this.data.pairsData.totalCount / this.pairsLimit)
    }

    /**
     *
     */
    public get isTransactionsLoading(): CurrencyStoreState['isTransactionsLoading'] {
        return this.state.isTransactionsLoading
    }

    /**
     *
     */
    public async loadTransactions(): Promise<void> {
        if (this.isTransactionsLoading) {
            return
        }

        try {
            this.changeState('isTransactionsLoading', true)

            const body: TransactionsRequest = {
                currencyAddresses: getImportedTokens(),
                currencyAddress: this.address,
                limit: this.transactionsLimit,
                offset: this.transactionsCurrentPage >= 1
                    ? (this.transactionsCurrentPage - 1) * this.transactionsLimit
                    : 0,
                ordering: this.transactionsOrdering,
                whiteListUri: DexConstants.TokenListURI,
            }
            if (this.transactionsEvents.length > 0) {
                body.eventType = this.transactionsEvents
            }

            const result = await this.api.transactions({}, {
                body: JSON.stringify(body),
            })

            this.changeData('transactionsData', result)
        }
        catch (e) {}
        finally {
            this.changeState('isTransactionsLoading', false)
        }
    }

    /**
     *
     */
    public get transactions(): CurrencyStoreData['transactionsData']['transactions'] {
        return this.data.transactionsData.transactions
    }

    /**
     *
     */
    public get transactionsEvents(): CurrencyStoreState['transactionsEventsType'] {
        return this.state.transactionsEventsType
    }

    /**
     *
     */
    public get transactionsCurrentPage(): CurrencyStoreState['transactionsCurrentPage'] {
        return this.state.transactionsCurrentPage
    }

    /**
     *
     */
    public get transactionsLimit(): CurrencyStoreState['transactionsLimit'] {
        return this.state.transactionsLimit
    }

    /**
     *
     */
    public get transactionsOrdering(): CurrencyStoreState['transactionsOrdering'] {
        return this.state.transactionsOrdering
    }

    /**
     *
     */
    public get transactionsTotalPages(): CurrencyStoreData['transactionsData']['totalCount'] {
        return Math.ceil(this.data.transactionsData.totalCount / this.transactionsLimit)
    }

    /*
     * Internal reaction disposers
     * ----------------------------------------------------------------------------------
     */

    #timeframeDisposer: IReactionDisposer | undefined

}
