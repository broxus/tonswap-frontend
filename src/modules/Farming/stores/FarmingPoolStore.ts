import BigNumber from 'bignumber.js'
import { action, makeAutoObservable } from 'mobx'
import ton, { Address } from 'ton-inpage-provider'

import { Farm, TokenWallet } from '@/misc'
import {
    DEFAULT_FARMING_POOL_STORE_DATA,
    DEFAULT_FARMING_POOL_STORE_STATE,
} from '@/modules/Farming/constants'
import { FarmingStore, useFarmingStore } from '@/modules/Farming/stores/FarmingStore'
import {
    FarmingPoolStoreData,
    FarmingPoolStoreDataProp,
    FarmingPoolStoreState, FarmingPoolStoreStateProp,
    FarmPool,
} from '@/modules/Farming/types'
import { depositToken, withdrawUnclaimed } from '@/modules/Farming/utils'
import { useWallet, WalletService } from '@/stores/WalletService'


export class FarmingPoolStore {

    /**
     *
     * @protected
     */
    protected data: FarmingPoolStoreData = DEFAULT_FARMING_POOL_STORE_DATA

    /**
     *
     * @protected
     */
    protected state: FarmingPoolStoreState = DEFAULT_FARMING_POOL_STORE_STATE

    /**
     *
     * @protected
     */
    protected poolUpdateTimeout: ReturnType<typeof setTimeout> | undefined

    constructor(
        protected pool: FarmPool,
        protected pools: FarmingStore,
        protected wallet: WalletService,
    ) {
        makeAutoObservable(this, {
            adminDepositToken: action.bound,
            adminWithdrawUnclaimed: action.bound,
            depositToken: action.bound,
            maxDeposit: action.bound,
            withdrawUnclaimed: action.bound,
        })
    }

    /*
     * External actions for use it in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @param key
     * @param value
     */
    public changeData<K extends keyof FarmingPoolStoreData>(key: K, value: FarmingPoolStoreData[K]): void {
        this.data[key] = value
    }

    /**
     *
     */
    public init(): void {
        if (this.wallet.address != null) {
            this.updateWalletBalances(this.isAdmin, this.wallet.address).finally(() => {
                this.syncPool().finally(() => {
                    this.updatePoolTimeTick()
                })
            })
        }
    }

    /**
     *
     */
    public dispose(): void {
        if (this.poolUpdateTimeout !== undefined) {
            clearTimeout(this.poolUpdateTimeout)
            this.poolUpdateTimeout = undefined
        }
    }

    /**
     *
     */
    public maxDeposit(): void {
        this.changeData(
            FarmingPoolStoreDataProp.USER_DEPOSIT,
            new BigNumber(this.userWalletBalance || '0')
                .shiftedBy(-this.pool.tokenDecimals)
                .decimalPlaces(this.pool.tokenDecimals, BigNumber.ROUND_DOWN)
                .toFixed(),
        )
    }

    /**
     *
     */
    public depositToken(): void {
        if (
            this.wallet.address == null
            || this.isUserDepositing
            || this.userDeposit == null
            || this.userWalletAddress == null
        ) {
            return
        }

        this.changeState(FarmingPoolStoreStateProp.IS_USER_DEPOSITING, true)

        depositToken(
            this.userDeposit,
            this.pool.tokenDecimals,
            this.pool.address,
            this.pool.tokenRoot,
            this.userWalletAddress,
            this.wallet.address,
        ).then(async value => {
            if (value == null) {
                return
            }

            if (this.poolUpdateTimeout != null) {
                clearTimeout(this.poolUpdateTimeout)
                this.poolUpdateTimeout = undefined
            }

            this.changeData(FarmingPoolStoreDataProp.USER_WALLET_BALANCE, value.newUserBalance)
            this.changeData(FarmingPoolStoreDataProp.USER_DEPOSIT, undefined)
            await this.syncPool()
        }).finally(() => {
            this.changeState(FarmingPoolStoreStateProp.IS_USER_DEPOSITING, false)
        })
    }

    /**
     *
     */
    public withdrawUnclaimed(): void {
        if (
            this.wallet.address == null
            || this.isUserDepositing
            || this.userWalletAddress == null
        ) { return }

        this.changeState(FarmingPoolStoreStateProp.IS_USER_DEPOSITING, true)

        withdrawUnclaimed(
            this.pool.address,
            this.wallet.address,
            this.userWalletAddress,
        ).then(async value => {
            if (value == null) {
                return
            }

            if (this.poolUpdateTimeout !== undefined) {
                clearTimeout(this.poolUpdateTimeout)
                this.poolUpdateTimeout = undefined
            }

            this.changeData(FarmingPoolStoreDataProp.USER_WALLET_BALANCE, value)
            await this.syncPool()
            this.updatePoolTimeTick()
        }).finally(() => {
            this.changeState(FarmingPoolStoreStateProp.IS_USER_DEPOSITING, false)
        })
    }

    /**
     *
     * @param idx
     */
    public async adminDepositToken(idx: number): Promise<void> {
        if (this.isAdminDepositing) { return }

        const deposit = new BigNumber(this.adminDeposit[idx] || '0')
            .shiftedBy(this.pool.rewardTokenDecimals[idx])
            .decimalPlaces(0)

        if (
            !deposit.isFinite()
            || !deposit.isPositive()
            || deposit.isZero()
            || this.wallet.address == null
        ) {
            return
        }

        this.changeState(FarmingPoolStoreStateProp.IS_ADMIN_DEPOSITING, true)

        const poolWallet = await TokenWallet.walletAddress({
            root: new Address(this.pool.rewardTokenRoot[idx]),
            owner: new Address(this.pool.address),
        })
        const poolWalletState = (await ton.getFullContractState({ address: poolWallet })).state

        if (poolWalletState === undefined || !poolWalletState.isDeployed) {
            this.changeState(FarmingPoolStoreStateProp.IS_ADMIN_DEPOSITING, false)
            return
        }

        await TokenWallet.send({
            address: new Address(this.pool.rewardTokenRoot[idx]),
            owner: new Address(this.wallet.address),
            recipient: poolWallet,
            tokens: deposit.toFixed(),
            withDerive: true,
        })
        const poolBalance = this.pool.rewardTokenBalance
        // eslint-disable-next-line no-constant-condition
        while (true) {
            // eslint-disable-next-line no-await-in-loop
            const newBalance = await TokenWallet.balance({ wallet: poolWallet })
            if (!(new BigNumber(newBalance).eq(poolBalance[idx]))) {
                const rewardTokenBalance = this.pool.rewardTokenBalance.slice()
                rewardTokenBalance[idx] = newBalance
                this.pools.updatePool(this.pool.tokenRoot, {
                    rewardTokenBalance,
                })
                const adminDeposit = this.adminDeposit.slice()
                adminDeposit[idx] = undefined
                this.changeData(FarmingPoolStoreDataProp.ADMIN_DEPOSIT, adminDeposit)
                this.changeState(FarmingPoolStoreStateProp.IS_ADMIN_DEPOSITING, false)
            }
        }
    }

    /**
     *
     */
    public adminWithdrawUnclaimed(): void {
        if (this.wallet.address == null) {
            return
        }

        this.changeState(FarmingPoolStoreStateProp.IS_ADMIN_WITHDRAW_UNCLAIMING, true)

        Farm.poolAdminWithdrawUnclaimed(
            new Address(this.pool.address),
            new Address(this.wallet.address),
        ).finally(() => {
            this.changeState(FarmingPoolStoreStateProp.IS_ADMIN_WITHDRAW_UNCLAIMING, false)
        })
    }

    /*
     * Internal utilities methods
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @param key
     * @param value
     * @protected
     */
    protected changeState<K extends keyof FarmingPoolStoreState>(key: K, value: FarmingPoolStoreState[K]): void {
        this.state[key] = value
    }

    /**
     *
     */
    protected getAdminDeposit(idx: number): string | undefined {
        const seconds = (this.pool.farmEnd - this.pool.farmStart) / 1000
        const reward = new BigNumber(this.pool.farmSpeed[idx]).multipliedBy(seconds)
        const depositAmount = reward
            .minus(this.pool.rewardTokenBalanceCumulative[idx])
            .shiftedBy(-this.pool.rewardTokenDecimals[idx])
            .decimalPlaces(this.pool.rewardTokenDecimals[idx], BigNumber.ROUND_UP)

        if (depositAmount.isFinite() && depositAmount.isPositive() && !depositAmount.isZero()) {
            return depositAmount.toFixed()
        }

        return undefined
    }

    /**
     *
     */
    protected async syncPool(): Promise<void> {
        const poolAddress = new Address(this.pool.address)
        const userDataAddress = new Address(this.pool.userDataAddress)
        const poolState = await ton.getFullContractState({ address: poolAddress })
        const poolBalance = await Farm.poolTokenBalance(poolAddress, poolState.state)
        const poolRewardBalance = await Farm.poolRewardTokenBalance(poolAddress, poolState.state)
        const poolRewardBalanceCumulative = await Farm.poolRewardTokenBalanceCumulative(poolAddress, poolState.state)
        let userBalance = '0',
            userRewardDebt: string[] = [],
            userDataDeployed = false

        try {
            const userData = await Farm.userDataAmountAndRewardDebt(userDataAddress)
            userBalance = userData.amount
            userRewardDebt = userData.rewardDebt
            userDataDeployed = true
        }
        catch (e) {}

        const userReward = await Farm.poolPendingReward(
            poolAddress,
            userBalance,
            userRewardDebt,
        )
        const share = poolBalance !== '0' ? new BigNumber(userBalance)
            .div(poolBalance)
            .multipliedBy('100')
            .shiftedBy(4)
            .decimalPlaces(0, BigNumber.ROUND_DOWN)
            .toFixed() : '0'

        this.pools.updatePool(this.pool.tokenRoot, {
            tokenBalance: poolBalance,
            rewardTokenBalance: poolRewardBalance,
            userBalance,
            userReward,
            userShare: share,
            userDataDeployed,
            rewardTokenBalanceCumulative: poolRewardBalanceCumulative,
        })
    }

    /**
     *
     */
    protected updatePoolTimeTick(): void {
        if (this.poolUpdateTimeout !== undefined) {
            clearTimeout(this.poolUpdateTimeout)
        }
        const localTimeout = setTimeout(async () => {
            if (localTimeout === this.poolUpdateTimeout) {
                await this.syncPool()
            }
            if (localTimeout === this.poolUpdateTimeout) {
                this.updatePoolTimeTick()
            }
        }, 5000)
        this.poolUpdateTimeout = localTimeout
    }

    /**
     *
     */
    protected async updateWalletBalances(isAdmin: boolean, accountAddress: string): Promise<void> {
        if (isAdmin) {
            if (this.adminWalletAddress.length === 0) {
                await Promise.all(
                    this.pool.rewardTokenRoot.map(
                        async address => (await TokenWallet.walletAddress({
                            owner: new Address(accountAddress),
                            root: new Address(address),
                        })).toString(),
                    ),
                ).then(value => {
                    this.changeData(FarmingPoolStoreDataProp.ADMIN_WALLET_ADDRESS, value)
                })
            }
            await Promise.all(
                this.adminWalletAddress.map(async address => {
                    try {
                        if (address != null) {
                            return await TokenWallet.balance({ wallet: new Address(address) })
                        }
                        return undefined
                    }
                    catch (e) {
                        return undefined
                    }
                }),
            ).then(value => {
                this.changeData(FarmingPoolStoreDataProp.ADMIN_WALLET_BALANCE, value)
            })
        }

        if (this.userWalletAddress == null) {
            await TokenWallet.walletAddress({
                owner: new Address(accountAddress),
                root: new Address(this.pool.tokenRoot),
            }).then(value => {
                this.changeData(FarmingPoolStoreDataProp.USER_WALLET_ADDRESS, value.toString())
            })
        }

        try {
            if (this.userWalletAddress != null) {
                await TokenWallet.balance({
                    wallet: new Address(this.userWalletAddress),
                }).then(value => {
                    this.changeData(FarmingPoolStoreDataProp.USER_WALLET_BALANCE, value)
                })
            }
        }
        catch (e) {
            this.changeData(FarmingPoolStoreDataProp.USER_WALLET_BALANCE, undefined)
        }

        this.changeData(
            FarmingPoolStoreDataProp.ADMIN_DEPOSIT,
            this.adminWalletAddress.map(
                (_, idx) => this.getAdminDeposit(idx),
            ),
        )
    }

    /*
     * Computed states
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get isAdmin(): boolean {
        return this.wallet.address != null && this.pool.owner === this.wallet.address
    }

    /*
     * Memoized store data values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get adminDeposit(): FarmingPoolStoreData[FarmingPoolStoreDataProp.ADMIN_DEPOSIT] {
        return this.data[FarmingPoolStoreDataProp.ADMIN_DEPOSIT]
    }

    /**
     *
     */
    public get adminWalletAddress(): FarmingPoolStoreData[FarmingPoolStoreDataProp.ADMIN_WALLET_ADDRESS] {
        return this.data[FarmingPoolStoreDataProp.ADMIN_WALLET_ADDRESS]
    }

    /**
     *
     */
    public get adminWalletBalance(): FarmingPoolStoreData[FarmingPoolStoreDataProp.ADMIN_WALLET_BALANCE] {
        return this.data[FarmingPoolStoreDataProp.ADMIN_WALLET_BALANCE]
    }

    /**
     *
     */
    public get userDeposit(): FarmingPoolStoreData[FarmingPoolStoreDataProp.USER_DEPOSIT] {
        return this.data[FarmingPoolStoreDataProp.USER_DEPOSIT]
    }

    /**
     *
     */
    public get userWalletAddress(): FarmingPoolStoreData[FarmingPoolStoreDataProp.USER_WALLET_ADDRESS] {
        return this.data[FarmingPoolStoreDataProp.USER_WALLET_ADDRESS]
    }

    /**
     *
     */
    public get userWalletBalance(): FarmingPoolStoreData[FarmingPoolStoreDataProp.USER_WALLET_BALANCE] {
        return this.data[FarmingPoolStoreDataProp.USER_WALLET_BALANCE]
    }

    /*
     * Memoized store state values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get isAdminDepositing(): FarmingPoolStoreState[FarmingPoolStoreStateProp.IS_ADMIN_DEPOSITING] {
        return this.state[FarmingPoolStoreStateProp.IS_ADMIN_DEPOSITING]
    }

    /**
     *
     */
    public get isAdminWithdrawUnclaiming(): FarmingPoolStoreState[
        FarmingPoolStoreStateProp.IS_ADMIN_WITHDRAW_UNCLAIMING] {
        return this.state[FarmingPoolStoreStateProp.IS_ADMIN_WITHDRAW_UNCLAIMING]
    }

    /**
     *
     */
    public get isUserDepositing(): FarmingPoolStoreState[FarmingPoolStoreStateProp.IS_USER_DEPOSITING] {
        return this.state[FarmingPoolStoreStateProp.IS_USER_DEPOSITING]
    }

}

export function useFarmingPool(pool: FarmPool): FarmingPoolStore {
    return new FarmingPoolStore(pool, useFarmingStore(), useWallet())
}
