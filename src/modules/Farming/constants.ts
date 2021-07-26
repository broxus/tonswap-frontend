import { FullContractState } from 'ton-inpage-provider'

import {
    CreateFarmPoolStoreData,
    CreateFarmPoolStoreState,
    FarmingPoolStoreData,
    FarmingPoolStoreDataProp,
    FarmingPoolStoreState,
    FarmingStoreData,
} from '@/modules/Farming/types'


export const DEFAULT_FARMING_STORE_DATA: FarmingStoreData = {
    pools: [],
    tokensCache: new Map<string, FullContractState>(),
}

export const DEFAULT_FARMING_POOL_STORE_DATA: FarmingPoolStoreData = {
    [FarmingPoolStoreDataProp.ADMIN_DEPOSIT]: [],
    [FarmingPoolStoreDataProp.ADMIN_WALLET_ADDRESS]: [],
    [FarmingPoolStoreDataProp.ADMIN_WALLET_BALANCE]: [],
    [FarmingPoolStoreDataProp.USER_DEPOSIT]: undefined,
    [FarmingPoolStoreDataProp.USER_WALLET_ADDRESS]: undefined,
    [FarmingPoolStoreDataProp.USER_WALLET_BALANCE]: undefined,
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
