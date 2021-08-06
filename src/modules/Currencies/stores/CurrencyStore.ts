import { UTCTimestamp } from 'lightweight-charts'
import { DateTime } from 'luxon'
import { action, makeAutoObservable } from 'mobx'

import { API_URL } from '@/constants'
import {
    DEFAULT_CURRENCY_STORE_DATA,
    DEFAULT_CURRENCY_STORE_STATE,
} from '@/modules/Currencies/constants'
import {
    CurrencyStoreData,
    CurrencyStoreState,
    CurrencyResponse,
    CurrencyGraphRequest,
    CurrencyStoreGraphData,
} from '@/modules/Currencies/types'
import { PairsRequest, PairsResponse } from '@/modules/Pairs/types'
import { TransactionsInfoResponse, TransactionsRequest } from '@/modules/Transactions/types'
import { parseCurrencyBillions } from '@/utils'
import {
    CandlestickGraphShape,
    CommonGraphShape,
    OhlcvGraphModel,
    TvlGraphModel,
    VolumeGraphModel,
} from '@/modules/Chart/types'


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

    constructor(protected readonly address: string) {
        makeAutoObservable(this, {
            loadGraph: action.bound,
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

            const response = await fetch(`${API_URL}/currencies/${this.address}`, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                mode: 'cors',
            })

            if (response.ok) {
                const result: CurrencyResponse = await response.json()
                this.changeData('currency', result)
            }
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
    public get isGraphLoading(): CurrencyStoreState['isGraphLoading'] {
        return this.state.isGraphLoading
    }

    /**
     *
     * @param {number} [from]
     * @param {number} [to]
     */
    public async loadGraph(from?: number, to?: number): Promise<void> {
        if (this.isGraphLoading) {
            return
        }

        try {
            this.changeState('isGraphLoading', true)

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
            const response = await fetch(`${API_URL}/currencies/${this.address}/${this.graph}`, {
                body: JSON.stringify(body),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                mode: 'cors',
            })

            if (response.ok) {
                if (this.graph === 'prices') {
                    const result: OhlcvGraphModel[] = await response.json()
                    this.changeGraphData('prices', result.concat(this.graphData.prices))
                }
                else if (this.graph === 'tvl') {
                    const result: TvlGraphModel[] = await response.json()
                    this.changeGraphData('tvl', result.concat(this.graphData.tvl))
                }
                else if (this.graph === 'volume') {
                    const result: VolumeGraphModel[] = await response.json()
                    this.changeGraphData('volume', result.concat(this.graphData.volume))
                }
            }
        }
        catch (e) {}
        finally {
            this.changeState('isGraphLoading', false)
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
            close: item.close,
            high: item.high,
            low: item.low,
            open: item.open,
            time: (item.timestamp / 1000) as UTCTimestamp,
        }))
    }

    /**
     *
     */
    public get volumeGraphData(): CommonGraphShape[] {
        return this.graphData.volume.map<CommonGraphShape>(item => ({
            time: (item.timestamp / 1000) as UTCTimestamp,
            value: item.data,
        }))
    }

    /**
     *
     */
    public get tvlGraphData(): CommonGraphShape[] {
        return this.graphData.tvl.map<CommonGraphShape>(item => ({
            time: (item.timestamp / 1000) as UTCTimestamp,
            value: item.data,
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
                currencyAddress: this.address,
                limit: this.pairsLimit,
                offset: this.pairsCurrentPage >= 1 ? (this.pairsCurrentPage - 1) * this.pairsLimit : 0,
                ordering: this.pairsOrdering,
            }
            const response = await fetch(`${API_URL}/pairs`, {
                body: JSON.stringify(body),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                mode: 'cors',
            })

            if (response.ok) {
                const result: PairsResponse = await response.json()
                this.changeData('pairsData', result)
            }
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
                currencyAddress: this.address,
                limit: this.transactionsLimit,
                offset: this.transactionsCurrentPage >= 1
                    ? (this.transactionsCurrentPage - 1) * this.transactionsLimit
                    : 0,
                ordering: this.transactionsOrdering,
            }
            const response = await fetch(`${API_URL}/transactions`, {
                body: JSON.stringify(body),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                mode: 'cors',
            })

            if (response.ok) {
                const result: TransactionsInfoResponse = await response.json()
                this.changeData('transactionsData', result)
            }
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

}
