import {
    BuilderStoreData, BuilderStoreDataProp, BuilderStoreState, BuilderStoreStateProp,
    CreateTokenStoreData, CreateTokenStoreDataProp, CreateTokenStoreState, CreateTokenStoreStateProp,
} from '@/modules/Builder/types'
import { FullContractState } from 'ton-inpage-provider'

export const DEFAULT_BUILDER_STORE_DATA: BuilderStoreData = {
    [BuilderStoreDataProp.TOKENS_CACHE]: new Map<string, FullContractState>(),
    [BuilderStoreDataProp.TOKENS]: [],
}

export const DEFAULT_BUILDER_STORE_STATE: BuilderStoreState = {
    [BuilderStoreStateProp.IS_LOADING]: false,
}

export const DEFAULT_CREATE_TOKEN_STORE_DATA: CreateTokenStoreData = {
    [CreateTokenStoreDataProp.NAME]: '',
    [CreateTokenStoreDataProp.SYMBOL]: '',
    [CreateTokenStoreDataProp.DECIMALS]: '',
}

export const DEFAULT_CREATE_TOKEN_STORE_STATE: CreateTokenStoreState = {
    [CreateTokenStoreStateProp.IS_CREATING]: false,
}
