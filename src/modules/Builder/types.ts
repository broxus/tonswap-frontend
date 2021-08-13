import {
    Address,
    DecodedAbiFunctionInputs,
    FullContractState,
    Transaction,
} from 'ton-inpage-provider'

import { TokenAbi } from '@/misc'

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
    token?: Token,
    tokenCache?: FullContractState,
    targetAddress: string;
    targetWalletBalance: string;
    amountToMint: string;
    newOwnerAddress: string;
}

export type ManageTokenStoreState = {
    tokenRoot: string,
    isLoading: boolean,
    isMinting: boolean,
    isTransfer: boolean,
}

export type Token = {
    decimals: number;
    name: string;
    symbol: string;
    total_supply: string;
    root: string;
    root_owner_address: Address;
    root_public_key: string;
}

export type CreateTokenSuccessResult = {
    input: DecodedAbiFunctionInputs<typeof TokenAbi.TokenRootDeployCallbacks, 'notifyTokenRootDeployed'>;
    transaction: Transaction;
}

export type CreateTokenFailureResult = {
    input?: DecodedAbiFunctionInputs<typeof TokenAbi.TokenRootDeployCallbacks, 'notifyTokenRootNotDeployed'>;
}
