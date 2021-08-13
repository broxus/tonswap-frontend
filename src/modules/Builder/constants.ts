import { FullContractState } from 'ton-inpage-provider'

import {
    BuilderStoreData,
    BuilderStoreState,
    CreateTokenStoreData,
    CreateTokenStoreState,
    ManageTokenStoreData,
    ManageTokenStoreState,
} from '@/modules/Builder/types'

export const DEFAULT_BUILDER_STORE_DATA: BuilderStoreData = {
    filter: '',
    tokens: [],
    tokensCache: new Map<string, FullContractState>(),
}

export const DEFAULT_BUILDER_STORE_STATE: BuilderStoreState = {
    isLoading: false,
}

export const DEFAULT_CREATE_TOKEN_STORE_DATA: CreateTokenStoreData = {
    decimals: '',
    name: '',
    symbol: '',
}

export const DEFAULT_CREATE_TOKEN_STORE_STATE: CreateTokenStoreState = {
    isCreating: false,
}

export const DEFAULT_MANAGE_TOKEN_STORE_DATA: ManageTokenStoreData = {
    token: undefined,
    tokenCache: undefined,
    targetAddress: '',
    amountToMint: '',
    newOwnerAddress: '',
    targetWalletBalance: '',
}

export const DEFAULT_MANAGE_TOKEN_STORE_STATE: ManageTokenStoreState = {
    tokenRoot: '',
    isLoading: false,
    isMinting: false,
    isTransfer: false,
}
