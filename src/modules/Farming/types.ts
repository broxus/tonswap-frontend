import { FullContractState, TransactionId } from 'ton-inpage-provider'

import { UserPendingReward } from '@/misc'


export type FarmPool = {
    address: string;
    owner: string;
    tokenRoot: string;
    tokenBalance: string;
    rewardTokenRoot: string[];
    rewardTokenBalance: string[];
    rewardTokenBalanceCumulative: string[];
    farmStart: number;
    farmEnd: number | undefined;
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
    isExpired: boolean;
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
    adminSetEndTime: string | undefined;
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

export type RewardTokenRootInfo = {
    reward_currency: string;
    reward_root_address: string;
    reward_scale: number;
}

export type FarmingPoolInfo = {
    apr: string;
    farm_end_time: number;
    farm_start_time: number;
    left_address?: string;
    left_currency?: string;
    pool_address: string;
    pool_owner_address: string;
    reward_token_root_info: RewardTokenRootInfo[];
    right_address?: string;
    right_currency?: string;
    share: string;
    token_root_address: string;
    token_root_currency: string;
    token_root_scale: number;
    tvl: string;
    tvl_change: string;
    user_token_balance: string;
}

export type FarmingPoolResponse = {
    pools_info: FarmingPoolInfo[];
    total_count: number;
}
