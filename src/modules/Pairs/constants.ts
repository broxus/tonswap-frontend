import {
    PairsStoreData,
    PairsStoreState,
    PairStoreData,
    PairStoreState,
} from '@/modules/Pairs/types'

export const DEFAULT_PAIRS_STORE_DATA: PairsStoreData = {
    pairs: [],
    totalCount: 0,
}

export const DEFAULT_PAIRS_STORE_STATE: PairsStoreState = {
    currentPage: 1,
    isLoading: false,
    limit: 10,
    ordering: 'tvldescending',
}

export const DEFAULT_PAIR_STORE_DATA: PairStoreData = {
    graphData: {
        ohlcv: [],
        tvl: [],
        volume: [],
    },
    pair: undefined,
    transactionsData: {
        count: 0,
        offset: 10,
        totalCount: 0,
        transactions: [],
    },
}

export const DEFAULT_PAIR_STORE_STATE: PairStoreState = {
    graph: 'ohlcv',
    isLoading: false,
    isOhlcvGraphLoading: false,
    isTransactionsLoading: false,
    isTvlGraphLoading: false,
    isVolumeGraphLoading: false,
    timeframe: 'H1',
    transactionsCurrentPage: 1,
    transactionsEventsType: [],
    transactionsLimit: 10,
    transactionsOrdering: 'blocktimedescending',
}
