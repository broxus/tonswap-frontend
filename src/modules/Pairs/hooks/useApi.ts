import { apiRoutes } from '@/routes'
import { createHandler } from '@/utils/create-handler'
import { PairResponse, PairsResponse } from '@/modules/Pairs/types'
import { OhlcvGraphModel, TvlGraphModel, VolumeGraphModel } from '@/modules/Chart/types'
import { TransactionsInfoResponse } from '@/modules/Transactions/types'

const pairsApi = {
    pairs: createHandler(apiRoutes.pairs)<PairsResponse>(),
    pair: createHandler(apiRoutes.pair)<PairResponse>(),
    pairOhlcv: createHandler(apiRoutes.pairOhlcv)<OhlcvGraphModel[]>(),
    pairTvl: createHandler(apiRoutes.pairTvl)<TvlGraphModel[]>(),
    pairVolume: createHandler(apiRoutes.pairVolume)<VolumeGraphModel[]>(),
    transactions: createHandler(apiRoutes.transactions)<TransactionsInfoResponse>(),
}

export type PairsApi = typeof pairsApi

export function usePairsApi(): PairsApi {
    return pairsApi
}
