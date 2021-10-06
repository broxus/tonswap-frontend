import BigNumber from 'bignumber.js'
import { Address } from 'ton-inpage-provider'
import { makeAutoObservable, runInAction, toJS } from 'mobx'

import { FarmingPoolResponse, Transaction } from '@/modules/Farming/types'
import { FarmingApi, useApi } from '@/modules/Farming/hooks/useApi'
import { getUserAmount, getUserPendingReward } from '@/modules/Farming/utils'
import { useWallet, WalletService } from '@/stores/WalletService'
import { TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import {
    Dex, Farm, PairBalances, PoolDetails,
    TokenWallet, UserPendingReward,
} from '@/misc'
import { error } from '@/utils'
import { SECONDS_IN_DAY } from '@/constants'

type Data = {
    apiResponse: FarmingPoolResponse;
    poolDetails: PoolDetails;
    userPoolDataAddress: Address;
    userLpWalletAddress: Address;
    userRewardTokensBalance: string[];
    userLpWalletAmount: string;
    userLpFarmingAmount: string;
    userPendingReward?: UserPendingReward;
    pairBalances?: PairBalances;
    lastUserWithdrawTransaction?: Transaction;
}

type State = {
    data?: Data;
    loading: boolean;
}

const defaultState: State = Object.freeze({
    loading: true,
})

export class FarmingDataStore {

    protected state: State = defaultState

    constructor(
        protected api: FarmingApi,
        protected wallet: WalletService,
        protected tokensCache: TokensCacheService,
    ) {
        makeAutoObservable(this, {}, { autoBind: true })
    }

    public dispose(): void {
        this.state = defaultState
    }

    public async getData(poolAddress: string): Promise<void> {
        runInAction(() => {
            this.state.loading = true
        })

        try {
            const ownerAddress = this.wallet.address

            if (!ownerAddress) {
                throw new Error('Wallet must be connected')
            }

            const [
                apiResponse, poolDetails,
            ] = await Promise.all([
                this.api.farmingPool({
                    address: poolAddress,
                }, {}, {
                    userAddress: this.wallet.address,
                }),
                Farm.poolGetDetails(
                    new Address(poolAddress),
                ),
            ])

            const [
                userPoolDataAddress, userLpWalletAddress, userRewardTokensBalance,
            ] = await Promise.all([
                Farm.userDataAddress(
                    new Address(poolAddress),
                    new Address(ownerAddress),
                ),
                TokenWallet.walletAddress({
                    owner: new Address(ownerAddress),
                    root: new Address(apiResponse.token_root_address),
                }),
                Promise.all(
                    poolDetails.rewardTokenRoot.map(tokenRoot => (
                        TokenWallet.balanceByTokenRoot(
                            new Address(ownerAddress),
                            tokenRoot,
                        )
                    )),
                ),
            ])

            const [
                userLpWalletAmount, userLpFarmingAmount, userPendingReward,
            ] = await Promise.all([
                TokenWallet.balanceByWalletAddress(
                    userLpWalletAddress,
                ),
                getUserAmount(
                    userPoolDataAddress,
                ),
                getUserPendingReward(
                    new Address(poolAddress),
                    userPoolDataAddress,
                    poolDetails.farmEndTime,
                ),
            ])

            const pairBalances = apiResponse.left_address && apiResponse.right_address
                ? await Dex.pairBalances(
                    await Dex.pairAddress(
                        new Address(apiResponse.left_address),
                        new Address(apiResponse.right_address),
                    ),
                )
                : undefined

            const userWithdrawTransaction = await this.api.transactions({}, {}, {
                poolAddress,
                limit: 1,
                offset: 0,
                eventTypes: ['withdraw'],
                ordering: 'blocktimedescending',
                userAddress: ownerAddress,
            })
            const [lastUserWithdrawTransaction] = userWithdrawTransaction.transactions

            runInAction(() => {
                this.state.data = {
                    apiResponse,
                    poolDetails,
                    userPoolDataAddress,
                    userLpWalletAddress,
                    userRewardTokensBalance,
                    userLpWalletAmount,
                    userLpFarmingAmount,
                    userPendingReward,
                    pairBalances,
                    lastUserWithdrawTransaction,
                }
            })

            this.syncTokens()
        }
        catch (e) {
            error(e)
        }
        finally {
            runInAction(() => {
                this.state.loading = false
            })
        }
    }

    public async syncData(): Promise<void> {
        try {
            if (!this.poolAddress) {
                throw new Error('Pool address must be exist in state')
            }

            await this.getData(this.poolAddress)
        }
        catch (e) {
            error(e)
        }
    }

    public syncTokens(): void {
        if (this.rewardTokensAddress) {
            this.rewardTokensAddress.forEach(address => {
                this.tokensCache.fetchIfNotExist(address)
            })
        }

        if (this.leftTokenAddress) {
            this.tokensCache.fetchIfNotExist(this.leftTokenAddress)
        }

        if (this.rightTokenAddress) {
            this.tokensCache.fetchIfNotExist(this.rightTokenAddress)
        }

        if ((!this.leftTokenAddress || !this.rightTokenAddress) && this.lpTokenAddress) {
            this.tokensCache.fetchIfNotExist(this.lpTokenAddress)
        }
    }

    public get loading(): boolean {
        return this.state.loading
    }

    public get dataIsExists(): boolean {
        return this.state.data !== undefined
    }

    public get apr(): string | undefined {
        return this.state.data?.apiResponse.apr
    }

    public get tvl(): string | undefined {
        return this.state.data?.apiResponse.tvl
    }

    public get leftTokenAddress(): string | undefined {
        return this.state.data?.apiResponse.left_address
    }

    public get leftTokenSymbol(): string | undefined {
        return this.state.data?.apiResponse.left_currency
    }

    public get rightTokenAddress(): string | undefined {
        return this.state.data?.apiResponse.right_address
    }

    public get rightTokenSymbol(): string | undefined {
        return this.state.data?.apiResponse.right_currency
    }

    public get pairBalanceLeft(): string | undefined {
        return this.state.data?.pairBalances?.left
    }

    public get pairBalanceRight(): string | undefined {
        return this.state.data?.pairBalances?.right
    }

    public get pairBalanceLp(): string | undefined {
        return this.state.data?.pairBalances?.lp
    }

    public get userLpWalletAmount(): string | undefined {
        return this.state.data?.userLpWalletAmount
    }

    public get userLpFarmingAmount(): string | undefined {
        return this.state.data?.userLpFarmingAmount
    }

    public get lpTokenAddress(): string | undefined {
        return this.state.data?.apiResponse.token_root_address
    }

    public get lpTokenSymbol(): string | undefined {
        return this.state.data?.apiResponse.token_root_currency
    }

    public get lpTokenDecimals(): number | undefined {
        return this.state.data?.apiResponse.token_root_scale
    }

    public get lpTokenBalance(): string | undefined {
        return this.state.data?.poolDetails.tokenBalance
    }

    public get poolAddress(): string | undefined {
        return this.state.data?.apiResponse.pool_address
    }

    public get poolOwnerAddress(): string | undefined {
        return this.state.data?.apiResponse.pool_owner_address
    }

    public get userPoolDataAddress(): string | undefined {
        return this.state.data?.userPoolDataAddress.toString()
    }

    public get userLpWalletAddress(): string | undefined {
        return this.state.data?.userLpWalletAddress.toString()
    }

    public get poolWalletAddress(): string | undefined {
        return this.state.data?.poolDetails.tokenWallet.toString()
    }

    public get startTime(): number | undefined {
        return this.state.data?.apiResponse.farm_start_time
    }

    public get rewardTokensAddress(): string[] | undefined {
        return this.state.data?.poolDetails.rewardTokenRoot.map(root => root.toString())
    }

    public get rewardTokensBalanceCumulative(): string[] | undefined {
        return toJS(this.state.data?.poolDetails.rewardTokenBalanceCumulative)
    }

    public get rewardTokensBalance(): string[] | undefined {
        return toJS(this.state.data?.poolDetails.rewardTokenBalance)
    }

    public get userInFarming(): boolean {
        return Boolean(this.state.data?.userPendingReward)
    }

    public get userPendingRewardVested(): string[] | undefined {
        return toJS(this.state.data?.userPendingReward?._vested || [])
    }

    public get userPendingRewardEntitled(): string[] | undefined {
        return toJS(this.state.data?.userPendingReward?._entitled || [])
    }

    public get userPendingRewardDebt(): string[] | undefined {
        return toJS(this.state.data?.userPendingReward?._pool_debt || [])
    }

    public get userRewardTokensBalance(): string[] | undefined {
        return toJS(this.state.data?.userRewardTokensBalance)
    }

    public get userShare(): string | undefined {
        return this.state.data?.apiResponse.share
    }

    public get vestingTime(): number {
        if (!this.state.data || !this.vestingPeriodDays || !this.userInFarming) {
            return 0
        }

        const vestingPeriodTime = parseInt(this.vestingPeriodDays, 10) * SECONDS_IN_DAY * 1000

        if (this.endTime > 0) {
            return vestingPeriodTime + this.endTime
        }

        if (this.userLpFarmingAmount === undefined) {
            return 0
        }

        const userLpFarmingAmountIsNotZero = new BigNumber(this.userLpFarmingAmount)
            .isGreaterThan(0)

        if (userLpFarmingAmountIsNotZero) {
            return vestingPeriodTime + new Date().getTime()
        }

        const { lastUserWithdrawTransaction } = this.state.data

        if (!lastUserWithdrawTransaction) {
            return 0
        }

        return lastUserWithdrawTransaction.timestampBlock + vestingPeriodTime
    }

    public get vestingRatio(): string | undefined {
        return this.state.data?.poolDetails.vestingRatio
    }

    public get vestingPeriodDays(): string | undefined {
        if (!this.state.data) {
            return undefined
        }

        return new BigNumber(this.state.data.poolDetails.vestingPeriod)
            .div(SECONDS_IN_DAY)
            .decimalPlaces(0, BigNumber.ROUND_DOWN)
            .toFixed()
    }

    public get endTime(): number {
        return parseInt(this.state.data?.poolDetails.farmEndTime || '0', 10) * 1000
    }

    public get isActive(): boolean {
        return this.endTime === 0 || new Date().getTime() < this.endTime
    }

    public get isAdmin(): boolean {
        if (!this.wallet.address) {
            return false
        }

        return this.poolOwnerAddress === this.wallet.address
    }

    public get rpsAmount(): string[] | undefined {
        if (!this.state.data) {
            return undefined
        }

        const activePeriods = this.state.data.poolDetails.rewardRounds
            .filter(({ startTime }) => (
                parseInt(startTime.toString(), 10) * 1000 < new Date().getTime()
            ))

        return activePeriods.length > 0
            ? activePeriods[activePeriods.length - 1].rewardPerSecond
            : []
    }

    public get roundRps(): string[][] | undefined {
        if (!this.state.data) {
            return undefined
        }

        return this.state.data.poolDetails.rewardRounds
            .map(round => round.rewardPerSecond)
    }

    public get roundStartTimes(): number[] | undefined {
        if (!this.state.data) {
            return undefined
        }

        return this.state.data.poolDetails.rewardRounds
            .map(round => parseInt(round.startTime, 10) * 1000)
    }

    public get rewardBalanceIsZero(): boolean | undefined {
        if (!this.rewardTokensBalance) {
            return undefined
        }

        return this.rewardTokensBalance
            .findIndex(amount => new BigNumber(amount).isLessThanOrEqualTo(0)) > -1
    }

    public get rewardBalanceIsLow(): boolean | undefined {
        return this.state.data?.apiResponse.is_low_balance
    }

}

const farmingDataStore = new FarmingDataStore(
    useApi(),
    useWallet(),
    useTokensCache(),
)

export function useFarmingDataStore(): FarmingDataStore {
    return farmingDataStore
}
