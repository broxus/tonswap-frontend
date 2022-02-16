import { DexConstants } from '@/misc'
import {
    SwapBill,
    SwapDirection,
    SwapExchangeMode,
    SwapStoreData,
    SwapStoreState,
} from '@/modules/Swap/types'


/* WTON root address */
export const DEFAULT_LEFT_TOKEN_ROOT = DexConstants.WEVERRootAddress.toString()

/* USDT root address */
export const DEFAULT_RIGHT_TOKEN_ROOT = DexConstants.USDTRootAddress.toString()

export const DEFAULT_DECIMALS = 18

export const DEFAULT_SWAP_BILL: SwapBill = {
    amount: undefined,
    expectedAmount: undefined,
    fee: undefined,
    minExpectedAmount: undefined,
    priceImpact: undefined,
}

export const DEFAULT_SWAP_STORE_DATA: SwapStoreData = {
    bestCrossExchangeRoute: undefined,
    bill: DEFAULT_SWAP_BILL,
    crossPairs: [],
    leftAmount: '',
    leftToken: undefined,
    priceLeftToRight: undefined,
    priceRightToLeft: undefined,
    rightAmount: '',
    rightToken: undefined,
    routes: [],
    slippage: '0.5',
}

export const DEFAULT_SWAP_STORE_STATE: SwapStoreState = {
    direction: SwapDirection.LTR,
    exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
    isCalculating: false,
    isConfirmationAwait: false,
    isCrossExchangeCalculating: false,
    isCrossExchangePreparing: false,
    isEnoughLiquidity: false,
    isPairChecking: false,
    isSwapping: false,
    priceDirection: SwapDirection.LTR,
}
