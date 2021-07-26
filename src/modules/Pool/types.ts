import { TokenCache } from '@/stores/TokensCacheService'
import { PairBalances, PairTokenRoots } from '@/misc'


export enum PoolStoreDataProp {
    LEFT_AMOUNT = 'leftAmount',
    LEFT_TOKEN = 'leftToken',
    RIGHT_AMOUNT = 'rightAmount',
    RIGHT_TOKEN = 'rightToken',
}

export type PoolStoreData = {
    [PoolStoreDataProp.LEFT_AMOUNT]: string;
    [PoolStoreDataProp.LEFT_TOKEN]?: TokenCache;
    [PoolStoreDataProp.RIGHT_AMOUNT]: string;
    [PoolStoreDataProp.RIGHT_TOKEN]?: TokenCache;
}

export type TokenSide = PoolStoreDataProp.LEFT_TOKEN | PoolStoreDataProp.RIGHT_TOKEN

export enum PoolStoreStateProp {
    IS_AUTO_EXCHANGE_ENABLE = 'isAutoExchangeEnable',
    IS_DEPOSITING_LEFT = 'isDepositingLeft',
    IS_DEPOSITING_LIQUIDITY = 'isDepositingLiquidity',
    IS_DEPOSITING_LP = 'isDepositingLp',
    IS_DEPOSITING_RIGHT = 'isDepositingRight',
    IS_SYNC_PAIR_BALANCES = 'isSyncPairBalances',
    IS_SYNC_PAIR_ROOTS = 'isSyncPairRoots',
    IS_WITHDRAWING_LEFT = 'isWithdrawingLeft',
    IS_WITHDRAWING_LIQUIDITY = 'isWithdrawingLiquidity',
    IS_WITHDRAWING_LP = 'isWithdrawingLp',
    IS_WITHDRAWING_RIGHT = 'isWithdrawingRight',
    STEP = 'step',
}

export type PoolStoreState = {
    [PoolStoreStateProp.IS_AUTO_EXCHANGE_ENABLE]: boolean;
    [PoolStoreStateProp.IS_DEPOSITING_LEFT]: boolean;
    [PoolStoreStateProp.IS_DEPOSITING_LIQUIDITY]: boolean;
    [PoolStoreStateProp.IS_DEPOSITING_LP]: boolean;
    [PoolStoreStateProp.IS_DEPOSITING_RIGHT]: boolean;
    [PoolStoreStateProp.IS_SYNC_PAIR_BALANCES]: boolean;
    [PoolStoreStateProp.IS_SYNC_PAIR_ROOTS]: boolean;
    [PoolStoreStateProp.IS_WITHDRAWING_LEFT]: boolean;
    [PoolStoreStateProp.IS_WITHDRAWING_LIQUIDITY]: boolean;
    [PoolStoreStateProp.IS_WITHDRAWING_LP]: boolean;
    [PoolStoreStateProp.IS_WITHDRAWING_RIGHT]: boolean;
    [PoolStoreStateProp.STEP]?: AddLiquidityStep;
}

export enum PoolPairProp {
    ADDRESS = 'address',
    BALANCES = 'balances',
    ROOTS = 'roots',
}

export type PoolPair = {
    [PoolPairProp.ADDRESS]?: string;
    [PoolPairProp.BALANCES]?: PairBalances;
    [PoolPairProp.ROOTS]?: PairTokenRoots;
}

export enum PoolDataProp {
    CURRENT_SHARE_LEFT = 'currentShareLeft',
    CURRENT_SHARE_PERCENT = 'currentSharePercent',
    CURRENT_SHARE_RIGHT = 'currentShareRight',
    IS_POOL_EMPTY = 'isPoolEmpty',
    LEFT_DEPOSIT = 'leftDeposit',
    LEFT_PRICE = 'leftPrice',
    LP_BALANCE = 'lpBalance',
    LP_DECIMALS = 'lpDecimals',
    LP_ROOT = 'lpRoot',
    LP_WALLET_ADDRESS = 'lpWalletAddress',
    LP_WALLET_BALANCE = 'lpWalletBalance',
    NEW_LEFT = 'newLeft',
    NEW_RIGHT = 'newRight',
    NEW_LEFT_PRICE = 'newLeftPrice',
    NEW_RIGHT_PRICE = 'newRightPrice',
    PAIR = 'pair',
    RIGHT_DEPOSIT = 'rightDeposit',
    RIGHT_PRICE = 'rightPrice',
    SHARE = 'share',
    SHARE_PERCENT = 'sharePercent',
    SHARE_CHANGE_PERCENT = 'shareChangePercent',
}

export type PoolData = {
    [PoolDataProp.CURRENT_SHARE_LEFT]?: string;
    [PoolDataProp.CURRENT_SHARE_PERCENT]?: string;
    [PoolDataProp.CURRENT_SHARE_RIGHT]?: string;
    [PoolDataProp.IS_POOL_EMPTY]: boolean | undefined;
    [PoolDataProp.LEFT_DEPOSIT]?: string;
    [PoolDataProp.LEFT_PRICE]?: string;
    [PoolDataProp.LP_BALANCE]?: string;
    [PoolDataProp.LP_DECIMALS]?: number;
    [PoolDataProp.LP_ROOT]?: string;
    [PoolDataProp.LP_WALLET_ADDRESS]?: string;
    [PoolDataProp.LP_WALLET_BALANCE]?: string;
    [PoolDataProp.NEW_LEFT]?: string;
    [PoolDataProp.NEW_RIGHT]?: string;
    [PoolDataProp.NEW_LEFT_PRICE]?: string;
    [PoolDataProp.NEW_RIGHT_PRICE]?: string;
    [PoolDataProp.PAIR]?: PoolPair;
    [PoolDataProp.RIGHT_DEPOSIT]?: string;
    [PoolDataProp.RIGHT_PRICE]?: string;
    [PoolDataProp.SHARE]?: string;
    [PoolDataProp.SHARE_PERCENT]?: string;
    [PoolDataProp.SHARE_CHANGE_PERCENT]?: string;
}

export enum DepositLiquiditySuccessDataProp {
    LEFT_DECIMALS = 'leftDecimals',
    RIGHT_DECIMALS = 'rightDecimals',
    LEFT_DEPOSIT = 'leftDeposit',
    RIGHT_DEPOSIT = 'rightDeposit',
    HASH = 'hash',
    LEFT_SYMBOL = 'leftSymbol',
    RIGHT_SYMBOL = 'rightSymbol',
    LP_DECIMALS = 'lpDecimals',
    LP_ROOT = 'lpRoot',
    NEW_LEFT = 'newLeft',
    NEW_RIGHT = 'newRight',
    NEW_LEFT_PRICE = 'newLeftPrice',
    NEW_RIGHT_PRICE = 'newRightPrice',
    CURRENT_SHARE_PERCENT = 'currentSharePercent',
    SHARE = 'share',
    SHARE_CHANGE_PERCENT = 'shareChangePercent',
    SHARE_PERCENT = 'sharePercent',
}

export type DepositLiquiditySuccessData = {
    [DepositLiquiditySuccessDataProp.LEFT_DECIMALS]: number;
    [DepositLiquiditySuccessDataProp.RIGHT_DECIMALS]: number;
    [DepositLiquiditySuccessDataProp.LEFT_DEPOSIT]: string;
    [DepositLiquiditySuccessDataProp.RIGHT_DEPOSIT]: string;
    [DepositLiquiditySuccessDataProp.HASH]: string;
    [DepositLiquiditySuccessDataProp.LEFT_SYMBOL]: string;
    [DepositLiquiditySuccessDataProp.RIGHT_SYMBOL]: string;
    [DepositLiquiditySuccessDataProp.LP_DECIMALS]: number;
    [DepositLiquiditySuccessDataProp.LP_ROOT]: string;
    [DepositLiquiditySuccessDataProp.NEW_LEFT]: string;
    [DepositLiquiditySuccessDataProp.NEW_RIGHT]: string;
    [DepositLiquiditySuccessDataProp.NEW_LEFT_PRICE]: string;
    [DepositLiquiditySuccessDataProp.NEW_RIGHT_PRICE]: string;
    [DepositLiquiditySuccessDataProp.CURRENT_SHARE_PERCENT]: string;
    [DepositLiquiditySuccessDataProp.SHARE]: string;
    [DepositLiquiditySuccessDataProp.SHARE_CHANGE_PERCENT]: string;
    [DepositLiquiditySuccessDataProp.SHARE_PERCENT]: string;
}

export enum DepositLiquidityErrorDataProp {
    LEFT_SYMBOL = 'leftSymbol',
    RIGHT_SYMBOL = 'rightSymbol',
}

export type DepositLiquidityErrorData = {
    [DepositLiquidityErrorDataProp.LEFT_SYMBOL]: string;
    [DepositLiquidityErrorDataProp.RIGHT_SYMBOL]: string;
}

export type DepositLiquidityResult = {
    success: boolean
    successData?: DepositLiquiditySuccessData,
    errorData?: DepositLiquidityErrorData
}

export enum AddLiquidityStep {
    INIT = 'init',
    CHECK_ACCOUNT = 'checkAccount',
    CONNECT_ACCOUNT = 'connectAccount',
    CONNECTING_ACCOUNT = 'connectingAccount',
    SELECT_PAIR = 'selectPair',
    CHECK_PAIR = 'checkPair',
    CREATE_POOL = 'createPool',
    CREATING_POOL = 'creatingPool',
    CONNECT_POOL = 'connectPool',
    CONNECTING_POOL = 'connectingPool',
    DEPOSIT_LIQUIDITY = 'depositLiquidity',
}
