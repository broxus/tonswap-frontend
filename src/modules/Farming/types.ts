
import { FullContractState, TransactionId } from 'ton-inpage-provider'
import {UserPendingReward} from "@/misc";


export type FarmPool = {
    address: string;
    owner: string;
    tokenRoot: string;
    tokenBalance: string;
    rewardTokenRoot: string[];
    rewardTokenBalance: string[];
    rewardTokenBalanceCumulative: string[];
    farmStart: number;
    farmSpeed: string[];
    tokenSymbol: string;
    tokenDecimals: number;
    rewardTokenSymbol: string[];
    rewardTokenDecimals: number[];
    prevTransactionId: TransactionId | undefined;
    userDataAddress: string;
    userDataDeployed: boolean;
    userBalance: string;
    userReward?: UserPendingReward;
    userShare: string;
    APY?: string;
    TVL?: string;
    isActive: boolean;
    vestingPeriod: string;
    vestingRatio: string
};

export type FarmingStoreData = {
    pools: FarmPool[];
    tokensCache: Map<string, FullContractState>;
}

export type FarmingStoreState = {
    isLoading: boolean;
}

export type FarmingPoolStoreData = {
    adminDeposit: (string | undefined)[];
    adminWalletAddress: (string | undefined)[];
    adminWalletBalance: (string | undefined)[];
    adminCreatePeriodStartTime: string | undefined;
    adminCreatePeriodRPS: (string | undefined)[];
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
    farmSpeed?: string;
    isRewardTotalValid?: boolean;
}

export type FarmVesting = {
    vestingPeriod?: string,
    vestingRatio?: string,
}

export type CreateFarmPoolStoreData = {
    farmStart: FarmDate;
    farmToken: FarmToken;
    rewardTokens: FarmRewardToken[];
    farmVesting: FarmVesting;
}

export type CreateFarmPoolStoreState = {
    isCreating: boolean;
}
