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

export type FarmingPoolsItemResponse = {
    apr: string;
    farm_end_time?: number;
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
    is_low_balance: boolean;
    apr_change: string;
}

export type FarmingPoolsResponse = {
    favorite_pools_info: FarmingPoolsItemResponse[];
    favorite_total_count: number;
    pools_info: FarmingPoolsItemResponse[];
    total_count: number;
}

export type FarmingPoolsOrdering =
    | 'tvlascending'
    | 'tvldescending'
    | 'aprascending'
    | 'aprdescending'
    | 'shareascending'
    | 'sharedescending'

export type FarmingPoolsRequest = {
    aprGe?: string;
    aprLe?: string;
    favoritePoolAddresses?: string[];
    isActive?: boolean;
    isAwaitingStart?: boolean;
    isWithMyFarming?: boolean;
    limit?: number;
    offset?: number;
    ordering?: FarmingPoolsOrdering;
    tvlGe?: string;
    tvlLe?: string;
    userAddress?: string;
    whiteCurrencyAddresses?: string[];
    whiteListUri?: string;
    rootAddresses?: string[];
    leftAddress?: string;
    rightAddress?: string;
    leftCurrency?: string;
    rightCurrency?: string;
    isLowBalance?: boolean;
}

export type FarmingPoolFilter = {
    leftRoot?: string;
    rightRoot?: string;
    state?: 'awaiting' | 'active' | 'noActive';
    ownerInclude?: boolean;
    tvlFrom?: string;
    tvlTo?: string;
    aprFrom?: string;
    aprTo?: string;
    isLowBalance?: boolean;
}

export type FarmingPoolResponse = {
    apr: string;
    apr_change: string;
    farm_end_time?: number;
    farm_start_time: number;
    left_address?: string;
    left_balance?: string;
    left_currency?: string;
    pool_address: string;
    pool_balance: string;
    pool_owner_address: string;
    reward_token_root_info: {
        reward_currency: string;
        reward_per_second: string;
        reward_root_address: string;
        reward_token_scale: number;
    }[];
    right_address?: string;
    right_balance?: string;
    right_currency?: string;
    share: string;
    share_change: string;
    token_root_address: string;
    token_root_currency: string;
    token_root_scale: number,
    tvl: string;
    tvl_change: string;
    is_low_balance: boolean;
    user_usdt_balance: string;
    pool_info: {
        vesting_period: number;
        vesting_ratio: number;
        rounds_info: {
            start_time: number;
            end_time?: number;
            reward_info: {
                rewardPerSec: string;
                rewardTokenCurrency: string;
                rewardTokenRootAddress: string;
                rewardTokenScale: string;
            }[];
        }[];
    };
    history_info: {
        left_amount: string;
        right_amount: string;
        usdt_amount: string;
    };
}

export type FarmingPoolRequest = {
    userAddress?: string;
    afterZeroBalance?: boolean;
}

export type EventType =
    | 'deposit'
    | 'withdraw'
    | 'claim'
    | 'rewarddeposit';

export type TransactionsOrdering =
    | 'blocktimeascending'
    | 'blocktimedescending'
    | 'lpvolumeascending'
    | 'lpvolumedescending'
    | 'tvascending'
    | 'tvdescending';

export type TransactionsKind =
    | 'Claim'
    | 'Deposit'
    | 'Withdraw'
    | 'RewardDeposit';

export type Transaction = {
    kind: TransactionsKind;
    messageHash: string;
    poolAddress: string;
    timestampBlock: number;
    tokenAddress: string;
    tokenCurrency: string;
    tokenExec: string;
    transactionHash: string;
    tvExec: string;
    userAddress: string;
    leftExec: string | null;
    rightExec: string | null;
}

export type TransactionsResponse = {
    totalCount: number,
    transactions: Transaction[],
}

export type TransactionsRequest = {
    eventTypes?: EventType[];
    limit?: number;
    offset?: number;
    ordering?: TransactionsOrdering;
    poolAddress?: string;
    rootTokenAmountGe?: string;
    rootTokenAmountLe?: string;
    timestampBlockGe?: number;
    timestampBlockLe?: number;
    tvGe?: string;
    tvLe?: string;
    userAddress?: string;
    whiteCurrencyAddresses?: string[];
    whiteListUri?: string[];
}

export type FarmingGraphicResponse = {
    data: string;
    timestamp: number;
}[]

export type FarmingGraphicRequest = {
    farmingPoolAddress: string;
    from: number;
    timeframe: 'H1' | 'D1';
    to: number;
}
