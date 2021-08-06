import {
    OhlcvGraphModel,
    Timeframe,
    TvlGraphModel,
    VolumeGraphModel,
} from '@/modules/Chart/types'
import { PairsOrdering, PairsResponse } from '@/modules/Pairs/types'
import { TransactionsInfoResponse, TransactionsOrdering } from '@/modules/Transactions/types'


export type CurrenciesOrdering = 'tvlascending' | 'tvldescending'

export type CurrencyInfo = {
    address: string;
    currency: string;
    fee24h: string;
    price: string;
    priceChange: string;
    transactionsCount24h: number;
    tvl: string;
    tvlChange: string;
    volume24h: string;
    volume7d: string;
    volumeChange24h: string;
    volumeChange7d: string;
}

export type CurrenciesStoreData = {
    currencies: CurrencyInfo[];
    totalCount: number;
}

export type CurrenciesStoreState = {
    currentPage: number;
    isLoading: boolean;
    limit: number;
    ordering: CurrenciesOrdering;
}

export type CurrenciesRequest = {
    limit: number;
    offset: number;
    ordering: CurrenciesOrdering;
}

export type CurrencyResponse = CurrencyInfo

export type CurrenciesResponse = {
    count: number;
    currencies: CurrencyInfo[];
    offset: number;
    totalCount: number;
}

export type CurrencyStoreGraphData = {
    prices: OhlcvGraphModel[];
    tvl: TvlGraphModel[];
    volume: VolumeGraphModel[];
}

export type CurrencyStoreData = {
    currency: CurrencyInfo | undefined;
    graphData: CurrencyStoreGraphData;
    pairsData: PairsResponse;
    transactionsData: TransactionsInfoResponse;
}

export type CurrencyStoreState = {
    graph: 'prices' | 'tvl' | 'volume'
    isGraphLoading: boolean;
    isLoading: boolean;
    isPairsLoading: boolean;
    isTransactionsLoading: boolean;
    pairsCurrentPage: number;
    pairsLimit: number;
    pairsOrdering: PairsOrdering;
    timeframe: Timeframe;
    transactionsCurrentPage: number;
    transactionsLimit: number;
    transactionsOrdering?: TransactionsOrdering | undefined;
}

export type CurrencyGraphRequest = {
    from: number;
    timeframe: Timeframe;
    to: number;
}


