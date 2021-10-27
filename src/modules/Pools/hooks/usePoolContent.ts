import * as React from 'react'
import { useParams } from 'react-router-dom'
import { Address } from 'ton-inpage-provider'
import BigNumber from 'bignumber.js'
import { useIntl } from 'react-intl'

import { PairResponse } from '@/modules/Pairs/types'
import { FarmingPoolsItemResponse, RewardTokenRootInfo } from '@/modules/Farming/types'
import { useTokensList } from '@/stores/TokensListService'
import { useDexAccount } from '@/stores/DexAccountService'
import { useWallet } from '@/stores/WalletService'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
import { useApi } from '@/modules/Pools/hooks/useApi'
import { useDexBalances } from '@/modules/Pools/hooks/useDexBalances'
import { FarmingTableProps } from '@/modules/Farming/components/FarmingTable'
import {
    error, formattedAmount, getPrice, shareAmount,
} from '@/utils'
import {
    Farm, Pool, PoolData, UserPendingReward,
} from '@/misc'
import { appRoutes } from '@/routes'

type RewardInfo = {
    vested: string;
    entitled: string;
    symbol: string;
}

type FarmingBalanceInfo = {
    reward: RewardInfo[];
}

type FarmInfo = {
    info: FarmingPoolsItemResponse;
    balance: FarmingBalanceInfo;
}

type UsePoolContent = {
    loading?: boolean;
    priceLeftToRight?: string;
    priceRightToLeft?: string;
    lockedLp?: string;
    lockedLeft?: string;
    lockedRight?: string;
    walletLeft?: string;
    walletRight?: string;
    totalLp?: string;
    totalLeft?: string;
    totalRight?: string;
    farmItems?: FarmingTableProps['items'];
    pool?: PoolData;
    pairAddress?: Address;
    ownerAddress?: Address;
    leftToken?: TokenCache;
    rightToken?: TokenCache;
    totalShare?: string;
}

export function usePoolContent(): UsePoolContent {
    const intl = useIntl()
    const api = useApi()
    const params = useParams<{ address: string }>()
    const wallet = useWallet()
    const tokensList = useTokensList()
    const dexAccount = useDexAccount()
    const dexBalances = useDexBalances()
    const tokensCache = useTokensCache()
    const [loading, setLoading] = React.useState(true)
    const [pool, setPool] = React.useState<PoolData | undefined>()
    const [pair, setPair] = React.useState<PairResponse | undefined>()
    const [farm, setFarm] = React.useState<FarmInfo[]>([])

    if (!wallet.address || !dexAccount.address) {
        return {}
    }

    const pairAddress = new Address(params.address)
    const ownerAddress = new Address(wallet.address)

    const leftToken = pool && tokensCache.get(pool.left.address)
    const rightToken = pool && tokensCache.get(pool.right.address)

    const priceLeftToRight = React.useMemo(() => (
        pair && pool && leftToken && rightToken && getPrice(
            pair.leftLocked,
            pair.rightLocked,
            leftToken.decimals,
            rightToken.decimals,
        )
    ), [pair, pool])

    const priceRightToLeft = React.useMemo(() => (
        pair && pool && leftToken && rightToken && getPrice(
            pair.rightLocked,
            pair.leftLocked,
            rightToken.decimals,
            leftToken.decimals,
        )
    ), [pair, pool])

    const lockedLp = React.useMemo(() => (
        pool && farm
            .reduce((acc, item) => (
                acc
                    .plus(item.info.user_token_balance)
                    .shiftedBy(item.info.token_root_scale)
            ), new BigNumber(0))
            .toFixed()
    ), [pool, farm])

    const lockedLeft = React.useMemo(() => (
        pool && lockedLp && shareAmount(
            lockedLp,
            pool.left.inPool,
            pool.lp.inPool,
            Number(tokensCache.get(pool.left.address)?.decimals),
        )
    ), [pool, lockedLp])

    const lockedRight = React.useMemo(() => (
        pool && lockedLp && shareAmount(
            lockedLp,
            pool.right.inPool,
            pool.lp.inPool,
            Number(tokensCache.get(pool.right.address)?.decimals),
        )
    ), [pool, lockedLp])

    const walletLeft = React.useMemo(() => (
        pool && leftToken && shareAmount(
            pool.lp.inWallet,
            pool.left.inPool,
            pool.lp.inPool,
            leftToken.decimals,
        )
    ), [pool])

    const walletRight = React.useMemo(() => (
        pool && rightToken && shareAmount(
            pool.lp.inWallet,
            pool.right.inPool,
            pool.lp.inPool,
            rightToken.decimals,
        )
    ), [pool])

    const totalLp = React.useMemo(() => (
        pool && lockedLp && new BigNumber(lockedLp)
            .plus(pool.lp.inWallet)
            .toFixed()
    ), [pool, lockedLp])

    const totalLeft = React.useMemo(() => (
        walletLeft && lockedLeft && new BigNumber(walletLeft)
            .plus(lockedLeft)
            .toFixed()
    ), [walletLeft, lockedLeft])

    const totalRight = React.useMemo(() => (
        walletRight && lockedRight && new BigNumber(walletRight)
            .plus(lockedRight)
            .toFixed()
    ), [walletRight, lockedRight])

    const totalShare = React.useMemo(() => (
        pool && totalLp
            ? new BigNumber(totalLp)
                .multipliedBy(100)
                .div(pool.lp.inPool)
                .decimalPlaces(8, BigNumber.ROUND_DOWN)
                .toFixed()
            : undefined
    ), [pool, totalLp])

    const farmItems = React.useMemo(() => (
        farm.map(({ info, balance: { reward }}) => ({
            tvl: info.tvl,
            tvlChange: info.tvl_change,
            apr: info.apr,
            aprChange: info.apr_change,
            share: info.share,
            startTime: info.farm_start_time,
            endTime: info.farm_end_time,
            leftToken: {
                address: info.left_address as string,
                name: info.left_currency as string,
                uri: tokensList.getUri(info.left_address as string),
            },
            rightToken: {
                address: info.right_address as string,
                name: info.right_currency as string,
                uri: tokensList.getUri(info.right_address as string),
            },
            rewardsIcons: info.reward_token_root_info.map(rewardToken => ({
                address: rewardToken.reward_root_address,
                uri: tokensList.getUri(rewardToken.reward_root_address),
            })),
            vestedRewards: reward.map(({ vested, symbol }) => (
                intl.formatMessage({
                    id: 'POOLS_LIST_TOKEN_BALANCE',
                }, {
                    symbol,
                    value: vested,
                })
            )),
            entitledRewards: reward.map(({ entitled, symbol }) => (
                intl.formatMessage({
                    id: 'POOLS_LIST_TOKEN_BALANCE',
                }, {
                    symbol,
                    value: entitled,
                })
            )),
            link: appRoutes.farmingItem.makeUrl({
                address: info.pool_address,
            }),
            balanceWarning: info.is_low_balance,
        }))
    ), [farm])

    const getFarmingPools = async (
        root: Address,
        owner: Address,
        limit: number = 100,
    ): Promise<FarmingPoolsItemResponse[]> => {
        const { total_count, pools_info } = await api.farmingPools({}, {
            body: JSON.stringify({
                limit,
                offset: 0,
                userAddress: owner.toString(),
                rootAddresses: [root.toString()],
                ordering: 'tvlascending',
                isLowBalance: false,
            }),
        })
        let poolsInfo = pools_info.filter(item => (
            item.left_address
            && item.left_currency
            && item.right_address
            && item.right_currency
        ))
        if (total_count > 100) {
            poolsInfo = await getFarmingPools(root, owner, total_count)
        }
        return poolsInfo
    }

    const getFarmReward = async (
        poolAddress: Address,
        userDataAddress: Address,
        rewardTokenInfo: RewardTokenRootInfo[],
        farmEnd?: number,
    ): Promise<RewardInfo[]> => {
        const poolRewardData = await Farm.poolCalculateRewardData(poolAddress)
        let userReward: UserPendingReward | undefined
        try {
            userReward = await Farm.userPendingReward(
                userDataAddress,
                poolRewardData._accTonPerShare,
                poolRewardData._lastRewardTime,
                `${farmEnd ? farmEnd / 1000 : 0}`,
            )
        }
        catch (e) {
            error(e)
        }
        return rewardTokenInfo.map(({ reward_currency, reward_scale }, index) => {
            const poolDebt = userReward ? userReward._pool_debt[index] : '0'
            const vested = userReward ? userReward._vested[index] : '0'
            const entitled = userReward ? userReward._entitled[index] : '0'
            const totalVested = new BigNumber(vested).plus(poolDebt)

            return {
                vested: formattedAmount(totalVested.toFixed(), reward_scale),
                entitled: formattedAmount(entitled, reward_scale),
                symbol: reward_currency,
            }
        })
    }

    const getFarmBalance = async (
        poolAddress: Address,
        walletAddress: Address,
        rewardTokenInfo: RewardTokenRootInfo[],
        farmEndTime?: number,
    ): Promise<FarmingBalanceInfo> => {
        const userDataAddress = await Farm.userDataAddress(poolAddress, walletAddress)
        const reward = await getFarmReward(
            poolAddress,
            userDataAddress,
            rewardTokenInfo,
            farmEndTime,
        )
        return {
            reward,
        }
    }

    const getFarmData = async (
        root: Address,
        owner: Address,
    ): Promise<FarmInfo[]> => {
        const pools = await getFarmingPools(root, owner)
        const balances = await Promise.all(
            pools.map(item => (
                getFarmBalance(
                    new Address(item.pool_address),
                    owner,
                    item.reward_token_root_info,
                    item.farm_end_time,
                )
            )),
        )
        return pools.map((item, index) => ({
            info: item,
            balance: balances[index],
        }))
    }

    const getData = async () => {
        try {
            const [poolData, pairData] = await Promise.all([
                Pool.pool(pairAddress, ownerAddress),
                api.pair({ address: pairAddress.toString() }),
            ])
            await Promise.all([
                tokensCache.fetchIfNotExist(poolData.left.address),
                tokensCache.fetchIfNotExist(poolData.right.address),
            ])
            const farmData = await getFarmData(
                new Address(poolData.lp.address),
                ownerAddress,
            )
            setPool(poolData)
            setPair(pairData)
            setFarm(farmData)
        }
        catch (e) {
            error(e)
        }
        setLoading(false)
    }

    React.useEffect(() => {
        getData()
    }, [
        dexBalances,
        params.address,
        wallet.address,
    ])

    return {
        loading,
        priceLeftToRight,
        priceRightToLeft,
        lockedLp,
        lockedLeft,
        lockedRight,
        walletLeft,
        walletRight,
        totalLp,
        totalLeft,
        totalRight,
        farmItems,
        pool,
        pairAddress,
        ownerAddress,
        leftToken,
        rightToken,
        totalShare,
    }
}
