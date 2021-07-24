import { FullContractState, TransactionId } from 'ton-inpage-provider'
import BigNumber from 'bignumber.js'


export type FarmPool = {
    address: string;
    owner: string;
    tokenRoot: string;
    tokenBalance: string;
    rewardTokenRoot: string[];
    rewardTokenBalance: string[];
    rewardTokenBalanceCumulative: string[];
    farmStart: number;
    farmEnd: number;
    farmSpeed: string[];
    tokenSymbol: string;
    tokenDecimals: number;
    rewardTokenSymbol: string[];
    rewardTokenDecimals: number[];
    prevTransactionId: TransactionId | undefined;
    userDataAddress: string;
    userDataDeployed: boolean;
    userBalance: string;
    userRewardDebt: string[];
    userReward: string[];
    userShare: string;
    APY?: string;
    TVL?: string;
    isExpired: boolean;
    isActive: boolean;
};

export type FarmingStoreData = {
    pools: FarmPool[];
    tokensCache: Map<string, FullContractState>;
}

export enum FarmingPoolStoreDataProp {
    ADMIN_DEPOSIT = 'adminDeposit',
    ADMIN_WALLET_ADDRESS = 'adminWalletAddress',
    ADMIN_WALLET_BALANCE = 'adminWalletBalance',
    USER_DEPOSIT = 'userDeposit',
    USER_WALLET_ADDRESS = 'userWalletAddress',
    USER_WALLET_BALANCE = 'userWalletBalance',
}

export type FarmingPoolStoreData = {
    [FarmingPoolStoreDataProp.ADMIN_DEPOSIT]: (string | undefined)[];
    [FarmingPoolStoreDataProp.ADMIN_WALLET_ADDRESS]: (string | undefined)[];
    [FarmingPoolStoreDataProp.ADMIN_WALLET_BALANCE]: (string | undefined)[];
    [FarmingPoolStoreDataProp.USER_DEPOSIT]: string | undefined;
    [FarmingPoolStoreDataProp.USER_WALLET_ADDRESS]: string | undefined;
    [FarmingPoolStoreDataProp.USER_WALLET_BALANCE]: string | undefined;
}

export enum FarmingPoolStoreStateProp {
    IS_ADMIN_DEPOSITING = 'isAdminDepositing',
    IS_ADMIN_WITHDRAW_UNCLAIMING = 'isAdminWithdrawUnclaiming',
    IS_USER_DEPOSITING = 'isUserDepositing',
}

export type FarmingPoolStoreState = {
    [FarmingPoolStoreStateProp.IS_ADMIN_DEPOSITING]: boolean;
    [FarmingPoolStoreStateProp.IS_ADMIN_WITHDRAW_UNCLAIMING]: boolean;
    [FarmingPoolStoreStateProp.IS_USER_DEPOSITING]: boolean;
}

export type FarmDate = {
    date?: Date | undefined;
    isValid?: boolean | undefined;
    value?: string | undefined;
}

export type FarmToken = {
    decimals?: number | undefined;
    isSyncing?: boolean | undefined;
    isValid?: boolean | undefined;
    root?: string | undefined;
    symbol?: string | undefined;
}

export type FarmRewardToken = FarmToken & {
    rewardTotal?: string;
    rewardTotalAmount?: BigNumber;
    isRewardTotalValid?: boolean;
}

export enum CreateFarmPoolStoreDataProp {
    FARM_END = 'farmEnd',
    FARM_START = 'farmStart',
    FARM_TOKEN = 'farmToken',
    REWARD_TOKENS = 'rewardTokens',
}

export type CreateFarmPoolStoreData = {
    [CreateFarmPoolStoreDataProp.FARM_END]: FarmDate;
    [CreateFarmPoolStoreDataProp.FARM_START]: FarmDate;
    [CreateFarmPoolStoreDataProp.FARM_TOKEN]: FarmToken;
    [CreateFarmPoolStoreDataProp.REWARD_TOKENS]: FarmRewardToken[];
}

export enum CreateFarmPoolStoreStateProp {
    IS_CREATING = 'isCreating',
}

export type CreateFarmPoolStoreState = {
    [CreateFarmPoolStoreStateProp.IS_CREATING]: boolean;
}
