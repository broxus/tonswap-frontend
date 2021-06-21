import {
    PoolData,
    PoolDataProp,
    PoolStoreData,
    PoolStoreDataProp,
    PoolStoreState, PoolStoreStateProp,
} from '@/modules/Pool/types'


export const DEFAULT_POOL_STORE_DATA: PoolStoreData = {
    [PoolStoreDataProp.LEFT_AMOUNT]: '',
    [PoolStoreDataProp.RIGHT_AMOUNT]: '',
    [PoolStoreDataProp.LEFT_TOKEN]: undefined,
    [PoolStoreDataProp.RIGHT_TOKEN]: undefined,
}

export const DEFAULT_POOL_STORE_STATE: PoolStoreState = {
    [PoolStoreStateProp.IS_AUTO_EXCHANGE_ENABLE]: false,
    [PoolStoreStateProp.IS_DEPOSITING_LEFT]: false,
    [PoolStoreStateProp.IS_DEPOSITING_LIQUIDITY]: false,
    [PoolStoreStateProp.IS_DEPOSITING_LP]: false,
    [PoolStoreStateProp.IS_DEPOSITING_RIGHT]: false,
    [PoolStoreStateProp.IS_SYNC_PAIR_BALANCES]: false,
    [PoolStoreStateProp.IS_SYNC_PAIR_ROOTS]: false,
    [PoolStoreStateProp.IS_WITHDRAWING_LEFT]: false,
    [PoolStoreStateProp.IS_WITHDRAWING_LIQUIDITY]: false,
    [PoolStoreStateProp.IS_WITHDRAWING_LP]:  false,
    [PoolStoreStateProp.IS_WITHDRAWING_RIGHT]: false,
}

export const DEFAULT_POOL_DATA: PoolData = {
    [PoolDataProp.IS_POOL_EMPTY]: undefined,
}
