import { FullContractState } from 'ton-inpage-provider'

import {
    CreateFarmPoolStoreData,
    CreateFarmPoolStoreState,
    FarmingPoolStoreData,
    FarmingPoolStoreState,
    FarmingStoreData,
} from '@/modules/Farming/types'


export const DEFAULT_FARMING_STORE_DATA: FarmingStoreData = {
    pools: [],
    tokensCache: new Map<string, FullContractState>(),
}

export const DEFAULT_FARMING_POOL_STORE_DATA: FarmingPoolStoreData = {
    adminDeposit: [],
    adminWalletAddress: [],
    adminWalletBalance: [],
    userDeposit: undefined,
    userWalletAddress: undefined,
    userWalletBalance: undefined,
}

export const DEFAULT_FARMING_POOL_STORE_STATE: FarmingPoolStoreState = {
    isAdminDepositing: false,
    isAdminWithdrawUnclaiming: false,
    isUserDepositing: false,
}

export const DEFAULT_CREATE_FARM_POOL_STORE_DATA: CreateFarmPoolStoreData = {
    farmToken: {},
    farmStart: {},
    farmEnd: {},
    rewardTokens: [
        {},
    ],
}

export const DEFAULT_CREATE_FARM_POOL_STORE_STATE: CreateFarmPoolStoreState = {
    isCreating: false,
}
