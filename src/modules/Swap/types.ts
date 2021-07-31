import { Address, DecodedAbiFunctionInputs, Transaction } from 'ton-inpage-provider'

import { DexAbi } from '@/misc'
import { TokenCache } from '@/stores/TokensCacheService'

export type SwapBill = {
    amount?: string;
    expectedAmount?: string;
    fee?: string;
    minExpectedAmount?: string;
    priceImpact?: string;
}

export type SwapPair = {
    address?: Address;
    balances?: SwapPairBalances;
    roots?: SwapPairRoots;
}

export type SwapPairBalances = {
    left: string;
    right: string;
}

export type SwapPairRoots = {
    left: Address;
    right: Address;
}

export type SwapStoreData = {
    leftAmount: string;
    leftToken?: TokenCache;
    pair?: SwapPair;
    priceDecimalsLeft?: number;
    priceDecimalsRight?: number;
    priceLeftToRight?: string;
    priceRightToLeft?: string;
    rightAmount: string;
    rightToken?: TokenCache;
    slippage: string;
}

export enum SwapDirection {
    LTR = 'ltr',
    RTL = 'rtl',
}

export type SwapStoreState = {
    direction: SwapDirection;
    isEnoughLiquidity: boolean;
    isLoading: boolean;
    isSwapping: boolean;
    isValid: boolean;
    pairExist: boolean;
    priceDirection?: SwapDirection;
}

export type SwapTransactionReceipt = {
    hash?: string;
    receivedAmount?: string;
    receivedDecimals?: number;
    receivedIcon?: string;
    receivedRoot?: string;
    receivedSymbol?: string;
    spentAmount?: string;
    spentDecimals?: number;
    spentFee?: string;
    spentSymbol?: string;
    success: boolean;
    transactionHash?: string;
}

export type SwapSuccessResult = {
    input: DecodedAbiFunctionInputs<typeof DexAbi.Callbacks, 'dexPairExchangeSuccess'>,
    transaction: Transaction
}

export type SwapFailureResult = {
    input?: DecodedAbiFunctionInputs<typeof DexAbi.Callbacks, 'dexPairOperationCancelled'>
}
