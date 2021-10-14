import { FARMING_POOL_API_URL } from '@/constants'
import { FarmingPoolsResponse } from '@/modules/Farming/types'
import { PairResponse } from '@/modules/Pairs/types'
import { apiRoutes, farmingApiRoutes } from '@/routes'
import { createHandler } from '@/utils/create-handler'
import { TransactionsInfoResponse } from '@/modules/Transactions/types'

const poolsApi = {
    farmingPools: createHandler(farmingApiRoutes.farmingPools, FARMING_POOL_API_URL)<FarmingPoolsResponse>(),
    pair: createHandler(apiRoutes.pair)<PairResponse>(),
    transactions: createHandler(apiRoutes.transactions)<TransactionsInfoResponse>(),
}

type PoolsApi = typeof poolsApi

export function useApi(): PoolsApi {
    return poolsApi
}
