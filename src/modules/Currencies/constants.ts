import {
    CurrenciesStoreData,
    CurrenciesStoreState,
    CurrencyStoreData,
    CurrencyStoreState,
} from '@/modules/Currencies/types'


export const DEFAULT_CURRENCIES_STORE_DATA: CurrenciesStoreData = {
    currencies: [],
    totalCount: 0,
}

export const DEFAULT_CURRENCIES_STORE_STATE: CurrenciesStoreState = {
    currentPage: 1,
    isLoading: false,
    limit: 10,
    ordering: 'tvldescending',
}

export const DEFAULT_CURRENCY_STORE_DATA: CurrencyStoreData = {
    currency: undefined,
    graphData: {
        prices: [],
        tvl: [],
        volume: [],
    },
    pairsData: {
        count: 0,
        offset: 10,
        pairs: [],
        totalCount: 0,
    },
    transactionsData: {
        count: 0,
        offset: 10,
        totalCount: 0,
        transactions: [],
    },
}

export const DEFAULT_CURRENCY_STORE_STATE: CurrencyStoreState = {
    graph: 'prices',
    isLoading: false,
    isPairsLoading: false,
    isPricesGraphLoading: false,
    isTransactionsLoading: false,
    isVolumeGraphLoading: false,
    isTvlGraphLoading: false,
    pairsCurrentPage: 1,
    pairsLimit: 10,
    pairsOrdering: 'tvldescending',
    timeframe: 'H1',
    transactionsCurrentPage: 1,
    transactionsEventsType: [],
    transactionsLimit: 10,
    transactionsOrdering: 'blocktimedescending',
}
