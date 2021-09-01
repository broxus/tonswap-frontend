import { DecodedAbiFunctionInputs, Transaction } from 'ton-inpage-provider'

import { DexAbi, PairBalances, PairTokenRoots } from '@/misc'


export type PoolStoreData = {
    leftAmount: string;
    leftToken?: string;
    rightAmount: string;
    rightToken?: string;
}

export type TokenSide = 'leftToken' | 'rightToken'

export type PoolStoreState = {
    isAutoExchangeEnabled: boolean;
    isDepositingLeft: boolean;
    isDepositingLiquidity: boolean;
    isDepositingLp: boolean;
    isDepositingRight: boolean;
    isSyncPairBalances: boolean;
    isSyncPairRoots: boolean;
    isWithdrawingLeft: boolean;
    isWithdrawingLiquidity: boolean;
    isWithdrawingRight: boolean;
    step?: AddLiquidityStep;
}

export type PoolPair = {
    address?: string;
    balances?: PairBalances;
    roots?: PairTokenRoots;
}

export type PoolData = {
    currentShareLeft?: string;
    currentSharePercent?: string;
    currentShareRight?: string;
    isPoolEmpty: boolean | undefined;
    leftDeposit?: string;
    leftPrice?: string;
    lpBalance?: string;
    lpDecimals?: number;
    lpRoot?: string;
    lpWalletAddress?: string;
    lpWalletBalance?: string;
    newLeft?: string;
    newRight?: string;
    newLeftPrice?: string;
    newRightPrice?: string;
    pair?: PoolPair;
    rightDeposit?: string;
    rightPrice?: string;
    share?: string;
    sharePercent?: string;
    shareChangePercent?: string;
}

export type DepositLiquiditySuccessResult = {
    input: DecodedAbiFunctionInputs<typeof DexAbi.Callbacks, 'dexPairDepositLiquiditySuccess'>,
    transaction: Transaction
}

export type DepositLiquidityFailureResult = {
    input?: DecodedAbiFunctionInputs<typeof DexAbi.Callbacks, 'dexPairOperationCancelled'>
}

export type DepositLiquiditySuccessData = {
    leftDecimals: number;
    rightDecimals: number;
    leftDeposit: string;
    rightDeposit: string;
    hash: string;
    leftSymbol: string;
    rightSymbol: string;
    lpDecimals: number;
    lpRoot: string;
    newLeft: string;
    newRight: string;
    newLeftPrice: string;
    newRightPrice: string;
    currentSharePercent: string;
    share: string;
    shareChangePercent: string;
    sharePercent: string;
}

export type DepositLiquidityErrorData = Pick<DepositLiquiditySuccessData, 'leftSymbol' | 'rightSymbol'>

export type DepositLiquidityReceipt = {
    success: boolean;
    successData?: DepositLiquiditySuccessData;
    errorData?: DepositLiquidityErrorData;
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
