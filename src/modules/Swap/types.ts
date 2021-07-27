import { Address, DecodedAbiFunctionInputs, Transaction } from 'ton-inpage-provider'

import { DexAbi } from '@/misc'
import { TokenCache } from '@/stores/TokensCacheService'


export enum SwapBillProp {
    AMOUNT = 'amount',
    EXPECTED_AMOUNT = 'expectedAmount',
    FEE = 'fee',
    MIN_EXPECTED_AMOUNT = 'minExpectedAmount',
    PRICE_IMPACT = 'priceImpact',
}

export type SwapBill = {
    [SwapBillProp.AMOUNT]?: string;
    [SwapBillProp.EXPECTED_AMOUNT]?: string;
    [SwapBillProp.FEE]?: string;
    [SwapBillProp.MIN_EXPECTED_AMOUNT]?: string;
    [SwapBillProp.PRICE_IMPACT]?: string;
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

export enum SwapStoreDataProp {
    LEFT_AMOUNT = 'leftAmount',
    LEFT_TOKEN = 'leftToken',
    PAIR = 'pair',
    PRICE_DECIMALS_LEFT = 'priceDecimalsLeft',
    PRICE_DECIMALS_RIGHT = 'priceDecimalsRight',
    PRICE_LEFT_TO_RIGHT = 'priceLeftToRight',
    PRICE_RIGHT_TO_LEFT = 'priceRightToLeft',
    RIGHT_AMOUNT = 'rightAmount',
    RIGHT_TOKEN = 'rightToken',
    SLIPPAGE = 'slippage',
}

export type SwapStoreData = {
    [SwapStoreDataProp.LEFT_AMOUNT]: string;
    [SwapStoreDataProp.LEFT_TOKEN]?: TokenCache;
    [SwapStoreDataProp.PAIR]?: SwapPair;
    [SwapStoreDataProp.PRICE_DECIMALS_LEFT]?: number;
    [SwapStoreDataProp.PRICE_DECIMALS_RIGHT]?: number;
    [SwapStoreDataProp.PRICE_LEFT_TO_RIGHT]?: string;
    [SwapStoreDataProp.PRICE_RIGHT_TO_LEFT]?: string;
    [SwapStoreDataProp.RIGHT_AMOUNT]: string;
    [SwapStoreDataProp.RIGHT_TOKEN]?: TokenCache;
    [SwapStoreDataProp.SLIPPAGE]: string;
}

export enum SwapDirection {
    LTR = 'ltr',
    RTL = 'rtl',
}

export enum SwapStoreStateProp {
    DIRECTION = 'direction',
    IS_ENOUGH_LIQUIDITY = 'isEnoughLiquidity',
    IS_LOADING = 'isLoading',
    IS_SWAPPING = 'isSwapping',
    IS_VALID = 'isValid',
    PAIR_EXIST = 'pairExist',
    PRICE_DIRECTION = 'priceDirection',
}

export type SwapStoreState = {
    [SwapStoreStateProp.DIRECTION]: SwapDirection;
    [SwapStoreStateProp.IS_ENOUGH_LIQUIDITY]: boolean;
    [SwapStoreStateProp.IS_LOADING]: boolean;
    [SwapStoreStateProp.IS_SWAPPING]: boolean;
    [SwapStoreStateProp.IS_VALID]: boolean;
    [SwapStoreStateProp.PAIR_EXIST]: boolean;
    [SwapStoreStateProp.PRICE_DIRECTION]?: SwapDirection;
}

export enum SwapTransactionProp {
    HASH = 'hash',
    RECEIVED_AMOUNT = 'receivedAmount',
    RECEIVED_DECIMALS = 'receivedDecimals',
    RECEIVED_ICON = 'receivedIcon',
    RECEIVED_ROOT = 'receivedRoot',
    RECEIVED_SYMBOL = 'receivedSymbol',
    SPENT_AMOUNT = 'spentAmount',
    SPENT_DECIMALS = 'spentDecimals',
    SPENT_FEE = 'spentFee',
    SPENT_SYMBOL = 'spentSymbol',
    SUCCESS = 'success',
    TRANSACTION_HASH = 'transactionHash',
}

export type SwapTransactionResult = {
    [SwapTransactionProp.HASH]?: string;
    [SwapTransactionProp.RECEIVED_AMOUNT]?: string;
    [SwapTransactionProp.RECEIVED_DECIMALS]?: number;
    [SwapTransactionProp.RECEIVED_ICON]?: string;
    [SwapTransactionProp.RECEIVED_ROOT]?: string;
    [SwapTransactionProp.RECEIVED_SYMBOL]?: string;
    [SwapTransactionProp.SPENT_AMOUNT]?: string;
    [SwapTransactionProp.SPENT_DECIMALS]?: number;
    [SwapTransactionProp.SPENT_FEE]?: string;
    [SwapTransactionProp.SPENT_SYMBOL]?: string;
    [SwapTransactionProp.SUCCESS]: boolean;
    [SwapTransactionProp.TRANSACTION_HASH]?: string;
}

export type SwapSuccessResult = {
    input: DecodedAbiFunctionInputs<typeof DexAbi.Callbacks, 'dexPairExchangeSuccess'>,
    transaction: Transaction
}

export type SwapFailureResult = {
    input: DecodedAbiFunctionInputs<typeof DexAbi.Callbacks, 'dexPairOperationCancelled'>
}
