import {
    SwapBill,
    SwapDirection,
    SwapExchangeMode,
    SwapStoreData,
    SwapStoreState,
} from '@/modules/Swap/types'


/* WTON root address */
export const DEFAULT_LEFT_TOKEN_ROOT = '0:0ee39330eddb680ce731cd6a443c71d9069db06d149a9bec9569d1eb8d04eb37'

/* USDT root address */
export const DEFAULT_RIGHT_TOKEN_ROOT = '0:751b6e22687891bdc1706c8d91bf77281237f7453d27dc3106c640ec165a2abf'

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
