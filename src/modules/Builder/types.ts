import {
    Address, FullContractState, DecodedAbiFunctionInputs, Transaction,
} from 'ton-inpage-provider'
import { TokenAbi } from '@/misc'

export enum BuilderStoreDataProp {
    TOKENS_CACHE = 'tokensCache',
    TOKENS = 'tokens',
    FILTER = 'filter',
}

export type BuilderStoreData = {
    [BuilderStoreDataProp.TOKENS_CACHE]: Map<string, FullContractState>,
    [BuilderStoreDataProp.TOKENS]: Token[],
    [BuilderStoreDataProp.FILTER]: string,
}

export enum BuilderStoreStateProp {
    IS_LOADING= 'isLoading'
}

export type BuilderStoreState = {
    [BuilderStoreStateProp.IS_LOADING]: boolean,
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
    root: string;
}

export type CreateTokenSuccessResult = {
    input: DecodedAbiFunctionInputs<typeof TokenAbi.TokenRootDeployCallbacks, 'notifyTokenRootDeployed'>,
    transaction: Transaction
}

export type CreateTokenFailureResult = {
    input: DecodedAbiFunctionInputs<typeof TokenAbi.TokenRootDeployCallbacks, 'notifyTokenRootNotDeployed'>
}
