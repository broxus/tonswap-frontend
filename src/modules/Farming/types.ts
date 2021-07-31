import BigNumber from 'bignumber.js'
import { FullContractState, TransactionId } from 'ton-inpage-provider'


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

export type FarmingPoolStoreData = {
    adminDeposit: (string | undefined)[];
    adminWalletAddress: (string | undefined)[];
    adminWalletBalance: (string | undefined)[];
    userDeposit: string | undefined;
    userWalletAddress: string | undefined;
    userWalletBalance: string | undefined;
}

export type FarmingPoolStoreState = {
    isAdminDepositing: boolean;
    isAdminWithdrawUnclaiming: boolean;
    isUserDepositing: boolean;
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

export type CreateFarmPoolStoreData = {
    farmEnd: FarmDate;
    farmStart: FarmDate;
    farmToken: FarmToken;
    rewardTokens: FarmRewardToken[];
}

export type CreateFarmPoolStoreState = {
    isCreating: boolean;
}
