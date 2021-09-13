import { apiRoutes } from '@/routes'
import { createHandler } from '@/utils/create-handler'
import { CurrenciesResponse, CurrencyResponse } from '@/modules/Currencies/types'
import { OhlcvGraphModel, TvlGraphModel, VolumeGraphModel } from '@/modules/Chart/types'
import { PairsResponse } from '@/modules/Pairs/types'
import { TransactionsInfoResponse } from '@/modules/Transactions/types'

const currenciesApi = {
    currencies: createHandler(apiRoutes.currencies)<CurrenciesResponse>(),
    currencie: createHandler(apiRoutes.currencie)<CurrencyResponse>(),
    currenciePrice: createHandler(apiRoutes.currenciePrice)<OhlcvGraphModel[]>(),
    currencieVolume: createHandler(apiRoutes.currencieVolume)<VolumeGraphModel[]>(),
    currencieTvl: createHandler(apiRoutes.currencieTvl)<TvlGraphModel[]>(),
    pairs: createHandler(apiRoutes.pairs)<PairsResponse>(),
    transactions: createHandler(apiRoutes.transactions)<TransactionsInfoResponse>(),
}


export type CurrenciesApi = typeof currenciesApi

export function useCurrenciesApi(): CurrenciesApi {
    return currenciesApi
}
