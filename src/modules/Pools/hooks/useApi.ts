import { FARMING_POOL_API_URL } from '@/constants'
import { FarmingPoolResponse } from '@/modules/Farming/types'
import { PairResponse } from '@/modules/Pairs/types'
import { apiRoutes } from '@/routes'
import { createHandler } from '@/utils/create-handler'
import { TransactionsInfoResponse } from '@/modules/Transactions/types'

const poolsApi = {
    farmingPools: createHandler(apiRoutes.farmingPools, FARMING_POOL_API_URL)<FarmingPoolResponse>(),
    pair: createHandler(apiRoutes.pair)<PairResponse>(),
    transactions: createHandler(apiRoutes.transactions)<TransactionsInfoResponse>(),
}

type PoolsApi = typeof poolsApi

export function useApi(): PoolsApi {
    return poolsApi
}
