import { apiRoutes } from '@/routes'
import { createHandler } from '@/utils'
import { NewCrossPairsResponse, PairResponse, PairsResponse } from '@/modules/Pairs/types'

const api = {
    crossPairs: createHandler(apiRoutes.crossPairs)<PairsResponse>(),
    newCrossPairs: createHandler(apiRoutes.newCrossPairs)<NewCrossPairsResponse>(),
    pair: createHandler(apiRoutes.pair)<PairResponse>(),
}

export type SwapApi = typeof api

export function useSwapApi(): SwapApi {
    return api
}
