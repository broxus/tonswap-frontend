import {
    DecodedAbiFunctionInputs,
    FullContractState,
    Transaction,
} from 'everscale-inpage-provider'


import { Token, TokenAbi } from '@/misc'

export type BuilderStoreData = {
    filter: string;
    tokens: Token[];
    tokensCache: Map<string, FullContractState>;
}

export type BuilderStoreState = {
    isLoading: boolean;
}

export type CreateTokenStoreData = {
    decimals: string;
    name: string;
    symbol: string;
}

export type CreateTokenStoreState = {
    isCreating: boolean;
}

export type CreateTokenTransactionResult = {
    hash?: string;
    name?: string;
    root?: string;
    success: boolean;
    symbol?: string;
}

export type ManageTokenStoreData = {
    token?: Token;
    tokenCache?: FullContractState;
    targetAddress: string;
    targetWalletBalance: string;
    amountToMint: string;
    amountToBurn: string;
    callbackAddress: string;
    callbackPayload: string;
    newOwnerAddress: string;
}

export type ManageTokenStoreState = {
    tokenRoot: string;
    isLoading: boolean;
    isMinting: boolean;
    isBurning: boolean;
    isTransfer: boolean;
}

export type CreateTokenSuccessResult = {
    input: DecodedAbiFunctionInputs<typeof TokenAbi.TokenRootDeployCallbacks, 'onTokenRootDeployed'>;
    transaction: Transaction;
}
