import BigNumber from 'bignumber.js'
import {
    IReactionDisposer,
    action,
    makeAutoObservable,
    reaction,
    runInAction,
} from 'mobx'
import ton, { Address, Contract, TransactionId } from 'ton-inpage-provider'

import { DEFAULT_FARMING_STORE_DATA } from '@/modules/Farming/constants'
import { FarmingStoreData, FarmPool } from '@/modules/Farming/types'
import {
    Dex,
    DexConstants,
    Farm,
    FarmAbi,
    TokenWallet,
} from '@/misc'
import { useWallet, WalletService } from '@/stores/WalletService'
import { filterEmpty, loadUniWTON } from '@/modules/Farming/utils'


export class FarmingStore {

    /**
     *
     * @protected
     */
    protected data: FarmingStoreData = DEFAULT_FARMING_STORE_DATA

    /**
     *
     * @param {WalletService} wallet
     */
    constructor(protected wallet: WalletService) {
        makeAutoObservable<FarmingStore, 'handleWalletAddressChange'>(this, {
            handleWalletAddressChange: action.bound,
        })
    }

    /*
     * External actions for use it in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public init(): void {
        this.#walletAccountDisposer = reaction(() => this.wallet.address, this.handleWalletAddressChange)

        if (this.wallet.address != null) {
            this.handleWalletAddressChange()
        }
    }

    /**
     *
     */
    public dispose(): void {
        this.#walletAccountDisposer?.()
    }

    /**
     *
     */
    public updatePool(tokenRoot: string, data: Partial<FarmPool>): void {
        this.data.pools = this.pools.map(pool => (pool.tokenRoot === tokenRoot ? { ...pool, ...data } : pool))
    }

    /*
     * Reactions handlers
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @param {string} [walletAddress]
     * @param {string} [prevWalletAddress]
     * @protected
     */
    protected async handleWalletAddressChange(walletAddress?: string, prevWalletAddress?: string): Promise<void> {
        if (!walletAddress || walletAddress !== prevWalletAddress) {
            this.reset()
        }

        await this.load(20).then(pools => {
            runInAction(() => {
                this.data.pools = pools
            })
        })
    }

    /*
     * Internal utilities methods
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @param {number} size
     * @param {TransactionId} [beforeTx]
     * @protected
     */
    protected async load(size: number, beforeTx?: TransactionId): Promise<FarmPool[]> {
        let buffer: FarmPool[] = [],
            currentTx = beforeTx

        // eslint-disable-next-line no-constant-condition
        while (true) {
            // eslint-disable-next-line no-await-in-loop
            const { pools, isEnd, txId } = await this.loadPools(currentTx)
            buffer = buffer.concat(pools)
            currentTx = txId
            if (isEnd || buffer.length >= size) {
                break
            }
        }

        return buffer.slice(0, size)
    }

    /**
     *
     * @param {TransactionId} [beforeTx]
     * @protected
     */
    protected async loadPools(
        beforeTx?: TransactionId,
    ): Promise<{pools: FarmPool[], isEnd: boolean, txId: TransactionId | undefined}> {
        const txs = await ton.getTransactions({
            continuation: beforeTx,
            address: DexConstants.FarmFabricAddress,
        })

        const dexRootState = (await ton.getFullContractState({
            address: DexConstants.DexRootAddress,
        })).state
        const wtonUsdtPairState = (await ton.getFullContractState({
            address: DexConstants.WTONUSDTPairAddress,
        })).state
        const wtonBridgePairState = (await ton.getFullContractState({
            address: DexConstants.WTONBRIDGEPairAddress,
        })).state
        const wtonDafPairState = (await ton.getFullContractState({
            address: DexConstants.WTONDAFPairAddress,
        })).state

        let wtonPrice: BigNumber | undefined,
            bridgePrice: BigNumber | undefined,
            dafPrice: BigNumber | undefined

        if (wtonUsdtPairState !== undefined && wtonUsdtPairState.isDeployed) {
            const {
                left: lru,
                right: rru,
            } = await Dex.pairTokenRoots(DexConstants.WTONUSDTPairAddress, wtonUsdtPairState)
            const {
                left: lbu,
                right: rbu,
            } = await Dex.pairBalances(DexConstants.WTONUSDTPairAddress, wtonUsdtPairState)

            if (DexConstants.WTONRootAddress.toString() === lru.toString()) {
                wtonPrice = new BigNumber(rbu).shiftedBy(-6).div(new BigNumber(lbu).shiftedBy(-9))
                    .decimalPlaces(6, BigNumber.ROUND_DOWN)
            }
            else if (DexConstants.WTONRootAddress.toString() === rru.toString()) {
                wtonPrice = new BigNumber(lbu).shiftedBy(-6).div(new BigNumber(rbu).shiftedBy(-9))
                    .decimalPlaces(6, BigNumber.ROUND_DOWN)
            }
        }

        if (wtonBridgePairState !== undefined && wtonBridgePairState.isDeployed && wtonPrice) {
            const {
                left: lru,
                right: rru,
            } = await Dex.pairTokenRoots(DexConstants.WTONBRIDGEPairAddress, wtonBridgePairState)
            const {
                left: lbu,
                right: rbu,
            } = await Dex.pairBalances(DexConstants.WTONBRIDGEPairAddress, wtonBridgePairState)

            if (DexConstants.WTONRootAddress.toString() === lru.toString()) {
                bridgePrice = new BigNumber(lbu).shiftedBy(-9).div(new BigNumber(rbu).shiftedBy(-9))
                    .multipliedBy(wtonPrice)
                    .decimalPlaces(6, BigNumber.ROUND_DOWN)
            }
            else if (DexConstants.WTONRootAddress.toString() === rru.toString()) {
                bridgePrice = new BigNumber(rbu).shiftedBy(-9).div(new BigNumber(lbu).shiftedBy(-9))
                    .multipliedBy(wtonPrice)
                    .decimalPlaces(6, BigNumber.ROUND_DOWN)
            }
        }

        if (wtonDafPairState !== undefined && wtonDafPairState.isDeployed && wtonPrice) {
            const {
                left: lru,
                right: rru,
            } = await Dex.pairTokenRoots(DexConstants.WTONDAFPairAddress, wtonDafPairState)
            const {
                left: lbu,
                right: rbu,
            } = await Dex.pairBalances(DexConstants.WTONDAFPairAddress, wtonDafPairState)
            if (DexConstants.WTONRootAddress.toString() === lru.toString()) {
                dafPrice = new BigNumber(lbu).shiftedBy(-9).div(new BigNumber(rbu).shiftedBy(-18))
                    .multipliedBy(wtonPrice)
                    .decimalPlaces(6, BigNumber.ROUND_DOWN)
            }
            else if (DexConstants.WTONRootAddress.toString() === rru.toString()) {
                dafPrice = new BigNumber(rbu).shiftedBy(-9).div(new BigNumber(lbu).shiftedBy(-18))
                    .multipliedBy(wtonPrice)
                    .decimalPlaces(6, BigNumber.ROUND_DOWN)
            }
        }

        if (dexRootState === undefined || !dexRootState.isDeployed) {
            return {
                pools: [],
                isEnd: true,
                txId: undefined,
            }
        }

        const fabricContract = new Contract(FarmAbi.Fabric, DexConstants.FarmFabricAddress)
        const pools = (await Promise.all(
            txs.transactions.map(
                tx => fabricContract.decodeTransactionEvents({
                    transaction: tx,
                }).then(async events => (
                    await Promise.all(events.map(newPool => {
                        if (newPool.event !== 'NewFarmPool') {
                            return undefined
                        }

                        return ton.getFullContractState({
                            address: newPool.data.pool,
                        }).then(async poolState => {
                            if (this.wallet.address == null) {
                                return undefined
                            }

                            const tokenRoot = newPool.data.tokenRoot.toString()
                            const rewardTokenRoot = newPool.data.rewardTokenRoot.map(a => a.toString())
                            const userDataAddress = await Farm.userDataAddress(
                                newPool.data.pool,
                                new Address(this.wallet.address),
                                poolState.state,
                            )
                            const poolBalance = await Farm.poolTokenBalance(newPool.data.pool, poolState.state)
                            const poolRewardBalance = await Farm.poolRewardTokenBalance(
                                newPool.data.pool,
                                poolState.state,
                            )
                            const poolRewardBalanceCumulative = await Farm.poolRewardTokenBalanceCumulative(
                                newPool.data.pool,
                                poolState.state,
                            )
                            const farmStart = parseInt(newPool.data.farmStartTime.toString(), 10) * 1000
                            const farmEnd = parseInt(newPool.data.farmEndTime.toString(), 10) * 1000
                            const seconds = (farmEnd - farmStart) / 1000
                            const isPoolOwner = this.wallet.address === newPool.data.pool_owner.toString()
                            const isExpired = (farmEnd - new Date().getTime()) < 0
                            const isActive = (farmStart - new Date().getTime()) < 0
                            const reward = newPool.data.rewardPerSecond.map(a => new BigNumber(a).multipliedBy(seconds))

                            if (
                                !isPoolOwner && (
                                    poolRewardBalanceCumulative
                                        .map((a, i) => new BigNumber(a).lt(reward[i]))
                                        .findIndex(a => a) >= 0
                                    || reward.map(a => a.isZero()).findIndex(a => a) >= 0
                                )
                            ) {
                                return undefined
                            }

                            let userBalance = '0',
                                userRewardDebt: string[] = [],
                                userReward: string[] = [],
                                userDataDeployed = false

                            try {
                                const userData = await Farm.userDataAmountAndRewardDebt(userDataAddress)
                                userBalance = userData.amount
                                userRewardDebt = userData.rewardDebt
                                userDataDeployed = true
                                userReward = await Farm.poolPendingReward(
                                    newPool.data.pool,
                                    userBalance,
                                    userRewardDebt,
                                    poolState.state,
                                )
                            }
                            catch (e) {}

                            if (
                                !isPoolOwner && isExpired
                                && new BigNumber(userBalance).isZero()
                                && userReward.findIndex(a => !new BigNumber(a).isZero()) < 0
                            ) {
                                return undefined
                            }
                            const tokenData = await this.loadTokenData(new Address(tokenRoot))
                            const rewardTokenData = await Promise.all(rewardTokenRoot.map(
                                a => this.loadTokenData(new Address(a)),
                            ))
                            const tokenOwner = await TokenWallet.rootOwnerAddress(
                                newPool.data.tokenRoot,
                                this.data.tokensCache.get(tokenRoot),
                            )
                            let APY: string | undefined,
                                TVL: string | undefined
                            const pairState = (await ton.getFullContractState({ address: tokenOwner })).state

                            if (pairState !== undefined && pairState.isDeployed) {
                                try {
                                    const { left, right } = await Dex.pairTokenRoots(tokenOwner, pairState)
                                    const pairAddress = await Dex.pairAddress(left, right, dexRootState)
                                    if (pairAddress.toString() === tokenOwner.toString()) {
                                        const { left: bl, right: br } = await Dex.pairBalances(pairAddress, pairState)
                                        let total,
                                            multiplier

                                        if (left.toString() === DexConstants.WTONRootAddress.toString()) {
                                            total = new BigNumber(bl).multipliedBy(2).shiftedBy(-9)
                                            multiplier = wtonPrice
                                        }
                                        else if (right.toString() === DexConstants.WTONRootAddress.toString()) {
                                            total = new BigNumber(br).multipliedBy(2).shiftedBy(-9)
                                            multiplier = wtonPrice
                                        }
                                        else if (left.toString() === DexConstants.USDTRootAddress.toString()) {
                                            total = new BigNumber(bl).multipliedBy(2).shiftedBy(-6)
                                            multiplier = new BigNumber('1')
                                        }
                                        else if (right.toString() === DexConstants.USDTRootAddress.toString()) {
                                            total = new BigNumber(br).multipliedBy(2).shiftedBy(-6)
                                            multiplier = new BigNumber('1')
                                        }
                                        else if (left.toString() === DexConstants.BRIDGERootAddress.toString()) {
                                            total = new BigNumber(bl).multipliedBy(2).shiftedBy(-9)
                                            multiplier = bridgePrice
                                        }
                                        else if (right.toString() === DexConstants.BRIDGERootAddress.toString()) {
                                            total = new BigNumber(br).multipliedBy(2).shiftedBy(-9)
                                            multiplier = bridgePrice
                                        }

                                        if (total !== undefined && multiplier !== undefined) {
                                            TVL = total.multipliedBy(multiplier)
                                                .decimalPlaces(0, BigNumber.ROUND_DOWN)
                                                .toFixed()
                                        }
                                    }
                                }
                                catch (e) {

                                }
                            }

                            if (tokenRoot === DexConstants.UniWTONUSDTLPRootAddress.toString() && wtonPrice) {
                                try {
                                    const uniWTON = await loadUniWTON()
                                    TVL = uniWTON.shiftedBy(-9)
                                        .multipliedBy(wtonPrice)
                                        .decimalPlaces(0)
                                        .toFixed()
                                }
                                catch (e) {}
                            }

                            if (tokenData === undefined || rewardTokenData.findIndex(a => a === undefined) >= 0) {
                                return undefined
                            }

                            if (TVL !== undefined) {
                                let i = 0,
                                    APYt = new BigNumber(0)

                                // eslint-disable-next-line no-restricted-syntax
                                for (const rtr of rewardTokenRoot) {
                                    let tokenPrice: BigNumber | undefined,
                                        tokenDecimals: number | undefined
                                    if (rtr === DexConstants.WTONRootAddress.toString()) {
                                        tokenPrice = wtonPrice
                                        tokenDecimals = 9
                                    }
                                    else if (rtr === DexConstants.BRIDGERootAddress.toString()) {
                                        tokenPrice = bridgePrice
                                        tokenDecimals = 9
                                    }
                                    else if (rtr === DexConstants.DAFRootAddress.toString()) {
                                        tokenPrice = dafPrice
                                        tokenDecimals = 18
                                    }
                                    if (tokenPrice !== undefined && tokenDecimals !== undefined) {
                                        const yearReward = new BigNumber(newPool.data.rewardPerSecond[i])
                                            .multipliedBy('31536000') // 365 * 86400
                                            .shiftedBy(-tokenDecimals)
                                        APYt = APYt.plus(
                                            yearReward
                                                .multipliedBy(tokenPrice)
                                                .div(TVL)
                                                .multipliedBy('100')
                                                .decimalPlaces(0, BigNumber.ROUND_DOWN),
                                        )
                                    }
                                    // eslint-disable-next-line no-plusplus
                                    i++
                                }
                                APY = APYt.isZero() ? undefined : APYt.toFixed()
                            }

                            const pool: FarmPool = {
                                address: newPool.data.pool.toString(),
                                owner: newPool.data.pool_owner.toString(),
                                tokenRoot,
                                tokenBalance: poolBalance,
                                rewardTokenRoot,
                                rewardTokenBalance: poolRewardBalance,
                                rewardTokenBalanceCumulative: poolRewardBalanceCumulative,
                                farmStart,
                                farmEnd,
                                farmSpeed: newPool.data.rewardPerSecond.map(a => a.toString()),
                                tokenDecimals: tokenData.decimals,
                                tokenSymbol: tokenData.symbol,
                                rewardTokenDecimals: rewardTokenData.map(a => (a ? a.decimals : 0)),
                                rewardTokenSymbol: rewardTokenData.map(a => (a ? a.symbol : '')),
                                prevTransactionId: tx.prevTransactionId,
                                userDataAddress: userDataAddress.toString(),
                                userDataDeployed,
                                userBalance,
                                userRewardDebt,
                                userReward,
                                userShare: poolBalance !== '0' ? new BigNumber(userBalance)
                                    .div(poolBalance)
                                    .multipliedBy('100')
                                    .shiftedBy(4)
                                    .decimalPlaces(0, BigNumber.ROUND_DOWN)
                                    .toFixed() : '0',
                                APY,
                                TVL,
                                isExpired,
                                isActive,
                            }
                            return pool
                        }).catch(() => undefined)
                    }))).filter(filterEmpty)),
            ),
        )).reduce<FarmPool[]>((acc, x) => acc.concat(x), new Array<FarmPool>())
        return {
            pools,
            isEnd: (
                txs.transactions.length === 0
                || txs.transactions[txs.transactions.length - 1].prevTransactionId === undefined
            ),
            txId: (
                txs.transactions.length === 0
                    ? undefined
                    : txs.transactions[txs.transactions.length - 1].prevTransactionId),
        }
    }

    /**
     *
     * @param {Address} root
     * @protected
     */
    protected async loadTokenData(root: Address): Promise<{decimals: number, symbol: string} | undefined> {
        let state = this.data.tokensCache.get(root.toString())
        if (state === undefined) {
            state = (await ton.getFullContractState({ address: root })).state
            if (state !== undefined) {
                this.data.tokensCache.set(root.toString(), state)
            }
        }
        if (state === undefined) { return undefined }
        const address = new Address(root.toString())
        let decimals,
            symbol
        try {
            decimals = parseInt(await TokenWallet.decimal(address, state), 10)
        }
        catch (e) {
            decimals = undefined
        }
        try {
            symbol = await TokenWallet.symbol(address, state)
        }
        catch (e) {
            symbol = undefined
        }
        if (symbol === undefined || decimals === undefined) { return undefined }

        return { decimals, symbol }
    }

    /**
     *
     * @protected
     */
    protected reset(): void {
        this.resetData()
    }

    /**
     *
     * @protected
     */
    protected resetData(): void {
        this.data = DEFAULT_FARMING_STORE_DATA
    }

    /*
     * Memoized store data values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get pools(): FarmPool[] {
        return this.data.pools
    }

    /*
     * Internal reaction disposers
     * ----------------------------------------------------------------------------------
     */

    #walletAccountDisposer: IReactionDisposer | undefined

}


const Farming = new FarmingStore(useWallet())

export function useFarmingStore(): FarmingStore {
    return Farming
}
