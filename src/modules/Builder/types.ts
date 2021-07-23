import { Address, FullContractState } from 'ton-inpage-provider'

export enum BuilderStoreDataProp {
    TOKENS_CACHE = 'tokensCache',
    TOKENS = 'tokens',
}

export type BuilderStoreData = {
    tokensCache: Map<string, FullContractState>,
    tokens: Token[],
}

export enum BuilderStoreStateProp {
    IS_LOADING= 'isLoading'
}

export type BuilderStoreState = {
    isLoading: boolean,
}

export enum CreateTokenStoreDataProp {
    NAME = 'name',
    SYMBOL = 'symbol',
    DECIMALS = 'decimals',
}

export type CreateTokenStoreData = {
    [CreateTokenStoreDataProp.NAME]: string;
    [CreateTokenStoreDataProp.SYMBOL]: string;
    [CreateTokenStoreDataProp.DECIMALS]: string;
}

export enum CreateTokenStoreStateProp {
    IS_CREATING = 'isCreating',
}

export type CreateTokenStoreState = {
    [CreateTokenStoreStateProp.IS_CREATING]: boolean;
}

export enum CreateTokenTransactionProp {
    HASH = 'hash',
    ROOT = 'root',
    NAME = 'name',
    SYMBOL = 'symbol',
    SUCCESS = 'success'
}

export type CreateTokenTransactionResult = {
    [CreateTokenTransactionProp.HASH]?: string;
    [CreateTokenTransactionProp.ROOT]?: string;
    [CreateTokenTransactionProp.NAME]?: string;
    [CreateTokenTransactionProp.SYMBOL]?: string;
    [CreateTokenTransactionProp.SUCCESS]: boolean;
}

export type Token = {
    name: string;
    symbol: string;
    decimals: string;
    total_supply: string;
    root_owner_address: Address;
    root_public_key: string;
}
