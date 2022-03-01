import { apiRoutes } from '@/routes'
import { createHandler } from '@/utils'
import { PairResponse, PairsResponse } from '@/modules/Pairs/types'

const api = {
    crossPairs: createHandler(apiRoutes.crossPairs)<PairsResponse>(),
    pair: createHandler(apiRoutes.pair)<PairResponse>(),
}

export type SwapApi = typeof api

export function useSwapApi(): SwapApi {
    return api
}
