import { apiRoutes } from '@/routes'
import { createHandler } from '@/utils/create-handler'
import { CurrenciesResponse, CurrencyResponse } from '@/modules/Currencies/types'
import { OhlcvGraphModel, TvlGraphModel, VolumeGraphModel } from '@/modules/Chart/types'
import { PairsResponse } from '@/modules/Pairs/types'
import { TransactionsInfoResponse } from '@/modules/Transactions/types'

const currenciesApi = {
    currencies: createHandler(apiRoutes.currencies)<CurrenciesResponse>(),
    currency: createHandler(apiRoutes.currency)<CurrencyResponse>(),
    currencyPrices: createHandler(apiRoutes.currencyPrices)<OhlcvGraphModel[]>(),
    currencyVolume: createHandler(apiRoutes.currencyVolume)<VolumeGraphModel[]>(),
    currencyTvl: createHandler(apiRoutes.currencyTvl)<TvlGraphModel[]>(),
    pairs: createHandler(apiRoutes.pairs)<PairsResponse>(),
    transactions: createHandler(apiRoutes.transactions)<TransactionsInfoResponse>(),
}


export type CurrenciesApi = typeof currenciesApi

export function useCurrenciesApi(): CurrenciesApi {
    return currenciesApi
}
