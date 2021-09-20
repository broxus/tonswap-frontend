import { apiRoutes } from '@/routes'
import { createHandler } from '@/utils/create-handler'
import { PairsResponse } from '@/modules/Pairs/types'

const api = {
    crossPairs: createHandler(apiRoutes.crossPairs)<PairsResponse>(),
}

export type SwapApi = typeof api

export function useSwapApi(): SwapApi {
    return api
}
