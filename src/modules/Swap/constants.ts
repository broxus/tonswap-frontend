import {
    SwapBill,
    SwapBillProp,
    SwapDirection,
    SwapStoreData,
    SwapStoreDataProp,
    SwapStoreState,
    SwapStoreStateProp,
} from '@/modules/Swap/types'


export const DEFAULT_LEFT_TOKEN_ROOT = '0:0ee39330eddb680ce731cd6a443c71d9069db06d149a9bec9569d1eb8d04eb37'

/* USDT root token address */
export const DEFAULT_RIGHT_TOKEN_ROOT = '0:751b6e22687891bdc1706c8d91bf77281237f7453d27dc3106c640ec165a2abf'

export const DEFAULT_DECIMALS = 18

export const DEFAULT_SWAP_BILL: SwapBill = {
    [SwapBillProp.AMOUNT]: undefined,
    [SwapBillProp.EXPECTED_AMOUNT]: undefined,
    [SwapBillProp.FEE]: undefined,
    [SwapBillProp.MIN_EXPECTED_AMOUNT]: undefined,
    [SwapBillProp.PRICE_IMPACT]: undefined,
}

export const DEFAULT_SWAP_STORE_DATA: SwapStoreData = {
    [SwapStoreDataProp.LEFT_AMOUNT]: '',
    [SwapStoreDataProp.LEFT_TOKEN]: undefined,
    [SwapStoreDataProp.PRICE_DECIMALS_LEFT]: undefined,
    [SwapStoreDataProp.PRICE_DECIMALS_RIGHT]: undefined,
    [SwapStoreDataProp.PRICE_LEFT_TO_RIGHT]: undefined,
    [SwapStoreDataProp.PRICE_RIGHT_TO_LEFT]: undefined,
    [SwapStoreDataProp.RIGHT_AMOUNT]: '',
    [SwapStoreDataProp.RIGHT_TOKEN]: undefined,
    [SwapStoreDataProp.SLIPPAGE]: '0.5',
}

export const DEFAULT_SWAP_STORE_STATE: SwapStoreState = {
    [SwapStoreStateProp.DIRECTION]: SwapDirection.LTR,
    [SwapStoreStateProp.IS_ENOUGH_LIQUIDITY]: false,
    [SwapStoreStateProp.IS_LOADING]: false,
    [SwapStoreStateProp.IS_SWAPPING]: false,
    [SwapStoreStateProp.IS_VALID]: false,
    [SwapStoreStateProp.PAIR_EXIST]: true,
    [SwapStoreStateProp.PRICE_DIRECTION]: SwapDirection.LTR,
}
