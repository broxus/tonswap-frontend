import { Address, Contract } from 'everscale-inpage-provider'
import type {
    DecodedAbiFunctionInputs,
    FullContractState,
    Transaction,
} from 'everscale-inpage-provider'

import { DexAbi } from '@/misc'
import type { TokenSide } from '@/modules/TokensList'
import type { TokenCache } from '@/stores/TokensCacheService'
import { WalletNativeCoin } from '@/stores/WalletService'


export type SwapOptions = {
    multipleSwapFee?: string;
    multipleSwapTokenRoot?: string;
    useNativeCoinByDefault?: boolean;
    wrapFee?: string;
}

export type SwapBill = {
    /** As the left amount */
    amount?: string;
    /** As the right amount */
    expectedAmount?: string;
    fee?: string;
    /** As the minimum received */
    minExpectedAmount?: string;
    priceImpact?: string;
}

export type SwapPair = {
    address?: Address;
    balances?: {
        left: string;
        right: string;
    };
    contract?: Contract<typeof DexAbi.Pair>;
    decimals?: {
        left: number;
        right: number;
    };
    denominator?: string;
    numerator?: string;
    roots?: {
        left: Address;
        right: Address;
    };
    state?: FullContractState;
    symbols?: {
        left: string;
        right: string;
    };
}

export type SwapRouteStep = {
    amount: string;
    expectedAmount: string;
    fee: string;
    from?: string;
    minExpectedAmount: string;
    pair: SwapPair;
    receiveAddress: Address;
    spentAddress: Address;
    to?: string;
}

export type SwapRoute = {
    bill: SwapBill;
    leftAmount: string;
    pairs: SwapPair[];
    priceLeftToRight?: string;
    priceRightToLeft?: string;
    rightAmount: string;
    slippage: string;
    steps: SwapRouteStep[];
    tokens: TokenCache[];
}

export type SwapRouteResult = {
    amount?: string;
    input?: DecodedAbiFunctionInputs<typeof DexAbi.Callbacks, 'dexPairExchangeSuccess'>,
    status?: 'success' | 'cancel';
    step: SwapRouteStep;
    transaction?: Transaction;
}

/**
 * @deprecated
 */
export type SwapStoreData = {
    bestCrossExchangeRoute?: SwapRoute;
    bill: SwapBill;
    crossPairs: SwapPair[];
    leftAmount: string;
    leftToken?: string;
    pair?: SwapPair;
    priceLeftToRight?: string;
    priceRightToLeft?: string;
    rightAmount: string;
    rightToken?: string;
    routes: SwapRoute[];
    slippage: string;
}

export enum SwapExchangeMode {
    CROSS_PAIR_EXCHANGE = 'crossPair',
    CROSS_PAIR_EXCHANGE_ONLY = 'crossPairOnly',
    DIRECT_EXCHANGE = 'direct',
    WRAP_EVER = 'wrapEver',
    UNWRAP_WEVER = 'unwrapWever',
}

export enum SwapDirection {
    LTR = 'ltr',
    RTL = 'rtl',
}

/**
 * @deprecated
 */
export type SwapStoreState = {
    direction: SwapDirection;
    exchangeMode: SwapExchangeMode;
    isCalculating: boolean;
    isConfirmationAwait: boolean;
    isCrossExchangeCalculating: boolean;
    isCrossExchangePreparing: boolean;
    isEnoughLiquidity: boolean;
    isLowTvl: boolean;
    isPairChecking: boolean;
    isSwapping: boolean;
    nativeCoinSide?: TokenSide;
    priceDirection?: SwapDirection;
}

export type SwapTransactionCallbacks = {
    onTransactionSuccess?: (response: SwapSuccessResult) => Promise<void> | void;
    onTransactionFailure?: (reason: SwapFailureResult) => Promise<void> | void;
}


export type SwapTransactionReceipt = {
    amount?: string;
    hash?: string;
    isCrossExchangeCanceled?: boolean;
    receivedDecimals?: number;
    receivedIcon?: string;
    receivedRoot?: string;
    receivedSymbol?: string;
    slippage?: string;
    spentAmount?: string;
    spentDecimals?: number;
    spentIcon?: string;
    spentFee?: string;
    spentRoot?: string;
    spentSymbol?: string;
    success: boolean;
}

export type SwapSuccessResult = {
    input: DecodedAbiFunctionInputs<typeof DexAbi.Callbacks, 'dexPairExchangeSuccess'>;
    transaction: Transaction;
}

export type SwapFailureResult = {
    cancelStep?: SwapRouteResult;
    index?: number;
    input?: DecodedAbiFunctionInputs<typeof DexAbi.Callbacks, 'dexPairOperationCancelled'>;
    step?: SwapRouteResult;
}


export interface BaseSwapStoreInitialData {
    leftAmount: string;
    leftToken?: string;
    rightAmount: string;
    rightToken?: string;
    slippage: string;
}

export interface BaseSwapStoreData extends BaseSwapStoreInitialData {
    transaction?: SwapTransactionReceipt | undefined;
}

export interface BaseSwapStoreState {
    isCalculating: boolean;
    isSwapping: boolean;
}

export interface DirectSwapStoreData extends BaseSwapStoreData {
    bill: SwapBill;
    pair?: SwapPair;
    priceLeftToRight?: string;
    priceRightToLeft?: string;
}

export interface DirectSwapStoreState extends BaseSwapStoreState {
    isLowTvl: boolean;
    isPairChecking: boolean;
}

export interface MultipleSwapStoreInitialData extends BaseSwapStoreInitialData {
    multipleSwapFee?: string;
}

export interface CrossPairSwapStoreData extends BaseSwapStoreData {
    crossPairs: SwapPair[];
    directBill: SwapBill;
    pair?: SwapPair;
    route?: SwapRoute;
    routes: SwapRoute[];
}

export interface CrossPairSwapStoreState extends BaseSwapStoreState {
    isPreparing: boolean;
}

export type ConversionStoreInitialData = {
    coin?: WalletNativeCoin;
    token?: string;
    wrapFee?: string;
}

export interface ConversionStoreData extends Exclude<ConversionStoreInitialData, 'wrapFee'> {
    amount: string;
    wrappedAmount?: string;
    txHash?: string;
    unwrappedAmount?: string;
}

export type ConversionStoreState = {
    isProcessing: boolean;
}

export type ConversionTransactionResponse = {
    amount: string;
    txHash: string;
}

export type ConversionTransactionCallbacks = {
    onTransactionSuccess?: (response: ConversionTransactionResponse) => void;
    onTransactionFailure?: (reason: unknown) => void;
}

export type SwapFormStoreState = {
    direction: SwapDirection;
    exchangeMode: SwapExchangeMode;
    isCalculating: boolean;
    isConfirmationAwait: boolean;
    isMultiple: boolean;
    nativeCoinSide?: TokenSide;
    priceDirection: SwapDirection;
}
