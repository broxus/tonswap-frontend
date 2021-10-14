import { FullContractState } from 'ton-inpage-provider'

import {
    CreateFarmPoolStoreData,
    CreateFarmPoolStoreState,
    FarmingPoolStoreData,
    FarmingPoolStoreState,
    FarmingStoreData,
    FarmingStoreState,
} from '@/modules/Farming/types'


export const DEFAULT_FARMING_STORE_DATA: FarmingStoreData = {
    pools: [],
    tokensCache: new Map<string, FullContractState>(),
}

export const DEFAULT_FARMING_STORE_STATE: FarmingStoreState = {
    isLoading: false,
}

export const DEFAULT_FARMING_POOL_STORE_DATA: FarmingPoolStoreData = {
    adminDeposit: [],
    adminWalletAddress: [],
    adminWalletBalance: [],
    adminCreatePeriodStartTime: undefined,
    adminCreatePeriodRPS: [],
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
    rewardTokens: [
        {},
    ],
    farmVesting: {},
}

export const DEFAULT_CREATE_FARM_POOL_STORE_STATE: CreateFarmPoolStoreState = {
    isCreating: false,
}

export const OWNERS_WHITE_LIST = [
    '0:963fb292d374584ffbc22bcd4ced88e2c1d6449df143739a77d0d26a7d610472',
    '0:de364b2ebc86bd2d7cd2d7ac5b17d5c55e2335400e54b2984b66aad5c87188bc',
    '0:674c2e9a3113a053c6cbd0dfff963e021757ad96ebd33d24138030ae95846fdb',
]

export const INTL_TRANSACTION_TYPE_ID_BY_KIND = {
    Claim: 'FARMING_TRANSACTIONS_TYPE_CLAIM',
    Deposit: 'FARMING_TRANSACTIONS_TYPE_DEPOSIT',
    Withdraw: 'FARMING_TRANSACTIONS_TYPE_WITHDRAW',
    RewardDeposit: 'FARMING_TRANSACTIONS_TYPE_REWARD',
}
