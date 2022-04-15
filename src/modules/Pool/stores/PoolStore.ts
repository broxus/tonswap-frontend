import BigNumber from 'bignumber.js'
import * as E from 'fp-ts/Either'
import isEqual from 'lodash.isequal'
import {
    action,
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
    reaction,
    runInAction,
} from 'mobx'
import { Address, Subscriber } from 'everscale-inpage-provider'

import { useRpcClient } from '@/hooks/useRpcClient'
import {
    checkPair,
    Dex,
    DexAbi,
    PairBalances,
    PairTokenRoots,
    TokenWallet,
} from '@/misc'
import { DEFAULT_DECIMALS } from '@/modules/Swap/constants'
import {
    DEFAULT_POOL_DATA,
    DEFAULT_POOL_STORE_DATA,
    DEFAULT_POOL_STORE_STATE,
} from '@/modules/Pool/constants'
import {
    AddLiquidityStep,
    DepositLiquidityFailureResult,
    DepositLiquidityReceipt,
    DepositLiquiditySuccessResult,
    PoolData,
    PoolStoreData,
    PoolStoreState,
} from '@/modules/Pool/types'
import { TokenSide } from '@/modules/TokensList'
import { DexAccountService, useDexAccount } from '@/stores/DexAccountService'
import { TokenCache, TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import { useWallet, WalletService } from '@/stores/WalletService'
import { FavoritePairs, useFavoritePairs } from '@/stores/FavoritePairs'
import {
    concatSymbols,
    debounce,
    error, formattedBalance,
    isGoodBignumber,
} from '@/utils'
import { BaseStore } from '@/stores/BaseStore'


const rpc = useRpcClient()


export class PoolStore extends BaseStore<PoolStoreData, PoolStoreState> {

    /**
     * Current data of the liquidity pool
     * @type {PoolData}
     * @protected
     */
    protected pool: PoolData = DEFAULT_POOL_DATA

    /**
     * Last deposit liquidity transaction result data
     * @type {DepositLiquidityReceipt | undefined}
     * @protected
     */
    protected depositLiquidityReceipt: DepositLiquidityReceipt | undefined = undefined

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly dex: DexAccountService,
        protected readonly favoritePairs: FavoritePairs,
    ) {
        super()

        this.resetData()
        this.resetState()

        makeObservable<
            PoolStore,
            | 'pool'
            | 'depositLiquidityReceipt'
            | 'changePoolData'
            | 'handleLpBalanceChange'
            | 'handleTokensChange'
            | 'handleStepChange'
            | 'handleWalletAddressChange'
        >(this, {
            pool: observable,
            depositLiquidityReceipt: observable,
            changePoolData: action.bound,
            handleLpBalanceChange: action.bound,
            handleTokensChange: action.bound,
            handleStepChange: action.bound,
            handleWalletAddressChange: action.bound,
            isAutoExchangeAvailable: computed,
            isDexAccountDataAvailable: computed,
            isPoolDataAvailable: computed,
            isPoolShareDataAvailable: computed,
            isSupplyComputeReady: computed,
            isSupplyReady: computed,
            dexLeftBalance: computed,
            isDexLeftBalanceValid: computed,
            isLeftTokenWithdrawAvailable: computed,
            dexRightBalance: computed,
            isDexRightBalanceValid: computed,
            isRightTokenWithdrawAvailable: computed,
            transaction: computed,
            isWithdrawLpAvailable: computed,
            isWithdrawLiquidityAvailable: computed,
            isLeftAmountValid: computed,
            isRightAmountValid: computed,
            leftAmount: computed,
            leftToken: computed,
            rightAmount: computed,
            rightToken: computed,
            formattedLeftBalance: computed,
            formattedRightBalance: computed,
            isAutoExchangeEnabled: computed,
            isDepositingLeft: computed,
            isDepositingLiquidity: computed,
            isDepositingRight: computed,
            isPreparing: computed,
            isSyncPairBalances: computed,
            isSyncPairRoots: computed,
            isWithdrawingLeftToken: computed,
            isWithdrawingLiquidity: computed,
            isWithdrawingRightToken: computed,
            step: computed,
            isPoolEmpty: computed,
            lpBalance: computed,
            lpDecimals: computed,
            lpRoot: computed,
            lpWalletAddress: computed,
            lpWalletBalance: computed,
            poolShare: computed,
            sharePercent: computed,
            shareChangePercent: computed,
            currentShareLeft: computed,
            currentSharePercent: computed,
            currentShareRight: computed,
            leftPrice: computed,
            rightPrice: computed,
            newLeftPrice: computed,
            newRightPrice: computed,
            leftDeposit: computed,
            rightDeposit: computed,
            pair: computed,
            pairAddress: computed,
            pairBalances: computed,
            pairRoots: computed,
            useTokensCache: computed,
        })
    }

    /*
     * External actions for use it in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     * Manually init all necessary subscribers.
     * Toggle to initial step.
     */
    public async init(): Promise<void> {
        await this.unsubscribeTransactionSubscriber()

        this.#transactionSubscriber = new rpc.Subscriber()

        this.#dexLeftBalanceValidationDisposer = reaction(() => this.isDexLeftBalanceValid, value => {
            if (value) {
                this.setState('isDepositingLeft', false)
            }
        })

        this.#dexRightBalanceValidationDisposer = reaction(() => this.isDexRightBalanceValid, value => {
            if (value) {
                this.setState('isDepositingRight', false)
            }
        })

        this.#dexBalancesUpdatesDisposer = reaction(
            () => this.dex.balances,
            async (balances, prevBalances) => {
                const shouldUpdate = !isEqual(
                    balances ? Object.fromEntries(balances?.entries()) : {},
                    prevBalances ? Object.fromEntries(prevBalances?.entries()) : {},
                )
                if (shouldUpdate) {
                    await this.syncLpBalance()
                }
            },
        )

        this.#lpBalanceDisposer = reaction(() => this.lpBalance, this.handleLpBalanceChange, {
            delay: 50,
        })

        this.#stepDisposer = reaction(() => this.step, this.handleStepChange, {
            delay: 50,
        })

        this.#tokensDisposer = reaction(
            () => [this.data.leftToken, this.data.rightToken],
            this.handleTokensChange,
        )

        this.#walletAccountDisposer = reaction(() => this.wallet.address, this.handleWalletAddressChange)

        if (this.wallet.address) {
            await this.handleStepChange(undefined)
            await this.setStep(AddLiquidityStep.INIT)
        }
    }

    /**
     * Manually dispose all of the internal subscribers.
     * Reset all data to their defaults.
     * Stop DEX account balances updater
     */
    public async dispose(): Promise<void> {
        await this.unsubscribeTransactionSubscriber()
        this.#dexBalancesUpdatesDisposer?.()
        this.#dexLeftBalanceValidationDisposer?.()
        this.#dexRightBalanceValidationDisposer?.()
        this.#stepDisposer?.()
        this.#tokensDisposer?.()
        this.#walletAccountDisposer?.()
        this.reset()
        this.dex.stopBalancesUpdater()
    }

    /**
     * Manually toggle auto exchange mode
     */
    public toggleAutoExchange(): void {
        this.setState('isAutoExchangeEnabled', !this.isAutoExchangeEnabled)

        if (!this.isAutoExchangeEnabled) {
            this.updateAmount()
        }
    }

    /**
     * Manually connect to a Dex account
     * @returns {Promise<void>}
     */
    public async connectDexAccount(): Promise<void> {
        if (!this.wallet.address) {
            return
        }

        try {
            this.setStep(AddLiquidityStep.CONNECTING_ACCOUNT)
            await this.dex.connectOrCreate()
        }
        catch (e) {
            error('Connect DEX account error', e)
            this.setStep(AddLiquidityStep.CONNECT_ACCOUNT)
        }
    }

    /**
     * Manually request to create pairs pool
     * @returns {Promise<void>}
     */
    public async createPool(): Promise<void> {
        if (
            !this.leftToken
            || !this.rightToken
            || !this.wallet.address
        ) {
            return
        }

        try {
            this.setStep(AddLiquidityStep.CREATING_POOL)

            await Dex.createPair(
                new Address(this.leftToken.root),
                new Address(this.rightToken.root),
                new Address(this.wallet.address),
            )
        }
        catch (e) {
            error('Create pair error', e)
            this.setStep(AddLiquidityStep.CHECK_PAIR)
        }
    }

    /**
     * Manually request to connect to pool
     * @returns {Promise<void>}
     */
    public async connectPool(): Promise<void> {
        if (
            !this.leftToken
            || !this.rightToken
            || !this.wallet.address
            || !this.dex.address
        ) {
            return
        }

        try {
            this.setStep(AddLiquidityStep.CONNECTING_POOL)
            await Dex.connectPair(
                new Address(this.dex.address),
                new Address(this.leftToken.root),
                new Address(this.rightToken.root),
                new Address(this.wallet.address),
            )
        }
        catch (e) {
            error('Connect pair error', e)
            this.setStep(AddLiquidityStep.CHECK_PAIR)
        }
    }

    /**
     * Manually sync pool share
     * @returns {Promise<void>}
     */
    public async fetchPoolShare(): Promise<void> {
        await this.syncPoolShare()
    }

    /**
     * Manually deposit token by the given token side.
     * @param {TokenSide} side
     * @returns {Promise<void>}
     */
    public async depositToken(side: TokenSide): Promise<void> {
        if (!this.wallet.address) {
            return
        }

        const token = this[side]

        if (!token) {
            return
        }

        const recipient = this.dex.getAccountWallet(token.root)

        if (!recipient) {
            return
        }

        let amount,
            dexBalance

        if (side === 'leftToken') {
            amount = this.leftAmount
            dexBalance = this.dexLeftBalance
            this.setState('isDepositingLeft', true)
        }
        else if (side === 'rightToken') {
            amount = this.rightAmount
            dexBalance = this.dexRightBalance
            this.setState('isDepositingRight', true)
        }

        const delta = new BigNumber(amount || 0)
            .shiftedBy(token.decimals)
            .minus(dexBalance || 0)
            .decimalPlaces(0, BigNumber.ROUND_UP)

        if (
            !delta.isPositive()
            || delta.isZero()
            || !delta.isFinite()
            || delta.isNaN()
        ) {
            return
        }

        try {
            await TokenWallet.send({
                address: new Address(token.root),
                recipient,
                owner: new Address(this.wallet.address),
                grams: '1500000000',
                tokens: delta.toFixed(),
                withDerive: true,
            })
        }
        catch (e) {
            error('Cannot deposit token', e)
            if (side === 'leftToken') {
                this.setState('isDepositingLeft', false)
            }
            else if (side === 'rightToken') {
                this.setState('isDepositingRight', false)
            }
        }
    }

    /**
     * Manually supply tokens to the pool
     */
    public async supply(): Promise<void> {
        if (
            !this.dex.address
            || !this.wallet.address
            || !this.leftToken
            || !this.rightToken
            || !this.lpRoot
            || (!this.leftAmount && !this.rightAmount)
        ) {
            return
        }

        this.cleanDepositLiquidityResult()
        this.setState('isDepositingLiquidity', true)

        const owner = new rpc.Contract(DexAbi.Callbacks, new Address(this.wallet.address))

        // eslint-disable-next-line no-bitwise
        const callId = ((Math.random() * 100000) | 0).toString()

        let stream = this.#transactionSubscriber?.transactions(
            new Address(this.wallet.address),
        )

        const oldStream = this.#transactionSubscriber?.oldTransactions(new Address(this.wallet.address), {
            fromLt: this.wallet.contract?.lastTransactionId?.lt,
        })

        if (stream !== undefined && oldStream !== undefined) {
            stream = stream.merge(oldStream)
        }

        const resultHandler = stream?.flatMap(a => a.transactions).filterMap(async transaction => {
            const result = await owner.decodeTransaction({
                transaction,
                methods: ['dexPairDepositLiquiditySuccess', 'dexPairOperationCancelled'],
            })

            if (result !== undefined) {
                if (
                    result.method === 'dexPairOperationCancelled'
                    && result.input.id.toString() === callId
                ) {
                    return E.left({ input: result.input })
                }

                if (
                    result.method === 'dexPairDepositLiquiditySuccess'
                    && result.input.id.toString() === callId
                    && result.input.via_account
                ) {
                    return E.right({ input: result.input, transaction })
                }
            }

            return undefined
        }).first()

        try {
            await Dex.depositAccountLiquidity(
                new Address(this.dex.address),
                new Address(this.wallet.address),
                new Address(this.leftToken.root),
                new Address(this.rightToken.root),
                new Address(this.lpRoot),
                new BigNumber(this.leftAmount || 0)
                    .shiftedBy(this.leftToken.decimals)
                    .decimalPlaces(0)
                    .toFixed(),
                new BigNumber(this.rightAmount || 0)
                    .shiftedBy(this.rightToken.decimals)
                    .decimalPlaces(0)
                    .toFixed(),
                this.isAutoExchangeEnabled,
                callId,
            )

            if (resultHandler !== undefined) {
                E.match(
                    (r: DepositLiquidityFailureResult) => this.handleLiquidityFailure(r),
                    (r: DepositLiquiditySuccessResult) => this.handleLiquiditySuccess(r),
                )(await resultHandler)
            }

            await this.dex.syncBalances()
            await this.syncPoolShare()
        }
        catch (e) {
            error('Cannot deposit liquidity', e)
            this.setState('isDepositingLiquidity', false)
        }
    }

    /**
     * Clean deposit liquidity transaction
     */
    public cleanDepositLiquidityResult(): void {
        this.depositLiquidityReceipt = undefined
    }

    /**
     * Withdraw token by the given root address and amount
     * @param {string} root
     * @param {string} amount
     */
    public async withdrawToken(root: string, amount: string): Promise<void> {
        if (root === this.leftToken?.root) {
            this.setState('isWithdrawingLeft', true)
        }
        else if (root === this.rightToken?.root) {
            this.setState('isWithdrawingRight', true)
        }

        try {
            // eslint-disable-next-line no-bitwise
            const callId = ((Math.random() * 100000) | 0).toString()
            await this.dex.withdrawToken(root, amount, callId)
        }
        catch (e) {
            error('Token withdraw error', e)
        }
        finally {
            if (root === this.leftToken?.root) {
                this.setState('isWithdrawingLeft', false)
            }
            else if (root === this.rightToken?.root) {
                this.setState('isWithdrawingRight', false)
            }
        }

        await this.syncPoolShare()
    }

    /**
     * Withdraw liquidity directly
     */
    public async withdrawLiquidity(): Promise<void> {
        if (
            !this.wallet.address
            || !this.dex.address
            || !this.leftToken
            || !this.rightToken
            || !this.lpWalletBalance
            || !this.lpRoot
        ) {
            return
        }

        this.setState('isWithdrawingLiquidity', true)

        try {
            await Dex.withdrawLiquidity(
                new Address(this.wallet.address),
                new Address(this.leftToken?.root),
                new Address(this.rightToken?.root),
                new Address(this.lpRoot),
                this.lpWalletBalance,
                new Date().getTime().toString(),
            )
        }
        catch (e) {
            error('Withdraw Liquidity error', e)
            this.setState('isWithdrawingLiquidity', false)
            return
        }

        await this.dex.syncBalances()
        await this.syncLpBalance()
        await this.syncPoolShare()

        this.setState('isWithdrawingLiquidity', false)
    }

    /*
     * Reactions handlers
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @param {string} balance
     * @param {string} prevBalance
     * @returns {Promise<void>}
     * @protected
     */
    protected async handleLpBalanceChange(balance?: string, prevBalance?: string): Promise<void> {
        if (!balance || balance === prevBalance || !this.pairAddress) {
            return
        }

        await this.syncPairRoots()
        await this.syncPairBalances()
        await this.syncPoolShare()
    }

    /**
     *
     * @param {AddLiquidityStep} step
     * @returns {Promise<void>}
     * @protected
     */
    protected async handleStepChange(step?: AddLiquidityStep): Promise<void> {
        if (!this.wallet.address) {
            return
        }

        switch (step) {
            case AddLiquidityStep.INIT:
                this.handleInitStep()
                break

            case AddLiquidityStep.CHECK_ACCOUNT:
                await this.handleCheckDexAccountStep()
                break

            case AddLiquidityStep.CONNECTING_ACCOUNT:
                await this.handleConnectingDexAccountStep()
                break

            case AddLiquidityStep.CHECK_PAIR:
                this.resetPoolData()
                this.resetState()
                this.setStep(AddLiquidityStep.CHECK_PAIR)
                await this.handleCheckPairStep()
                break

            case AddLiquidityStep.CREATING_POOL:
                await this.handleCreatingPoolStep()
                break

            case AddLiquidityStep.CONNECTING_POOL:
                await this.handleConnectingPoolStep()
                break

            default:
        }
    }

    /**
     *
     * @param {(string | undefined)[]} roots
     * @param {(string | undefined)[]} prevRoots
     * @returns {Promise<void>}
     * @protected
     */
    protected handleTokensChange(
        roots: (string | undefined)[] = [],
        prevRoots: (string | undefined)[] = [],
    ): void {
        const [leftRoot, rightRoot] = roots
        const [prevLeftRoot, prevRightRoot] = prevRoots

        if (leftRoot === prevLeftRoot && rightRoot === prevRightRoot) {
            return
        }

        const isLeftChanged = leftRoot !== undefined && leftRoot !== prevLeftRoot
        const isRightChanged = rightRoot !== undefined && rightRoot !== prevRightRoot

        if (leftRoot === rightRoot) {
            if (isLeftChanged) {
                this.setData({
                    leftAmount: '',
                    rightAmount: this.leftAmount,
                    rightToken: undefined,
                })
            }
            else if (isRightChanged) {
                this.setData({
                    leftAmount: this.rightAmount,
                    leftToken: undefined,
                    rightAmount: '',
                })
            }
            this.changePoolData('pair', undefined)
        }

        if (leftRoot && rightRoot) {
            this.setStep(AddLiquidityStep.CHECK_PAIR)
        }
    }

    /**
     *
     * @param {string} [walletAddress]
     * @param {string} [prevWalletAddress]
     * @protected
     */
    protected handleWalletAddressChange(walletAddress?: string, prevWalletAddress?: string): void {
        if (!walletAddress || walletAddress !== prevWalletAddress) {
            this.reset()
            this.setStep(AddLiquidityStep.INIT)
        }
    }

    /*
     * Internal swap processing handlers
     * ----------------------------------------------------------------------------------
     */

    /**
     * Success transaction callback handler
     * @param {DepositLiquiditySuccessResult['input']} input
     * @param {DepositLiquiditySuccessResult['transaction']} transaction
     * @protected
     */
    protected async handleLiquiditySuccess({ input, transaction }: DepositLiquiditySuccessResult): Promise<void> {
        if (
            !transaction
            || !this.wallet.address
            || !this.pairRoots
            || !this.leftToken
            || !this.rightToken
            || !this.pairBalances
            || !this.lpRoot
            || !this.lpDecimals
        ) {
            return
        }

        try {
            await this.syncLpBalance()
        }
        catch (e) {
            error('Transaction LP Wallet balance error', e)
        }

        const leftSymbol = this.leftToken.symbol
        const rightSymbol = this.rightToken.symbol
        const {
            left: pairLeftBalance = '0',
            lp: pairLpBalance = '0',
            right: pairRightBalance = '0',
        } = this.pairBalances

        // Add to favorites after add liquidity
        if (this.pairAddress) {
            let name: string | undefined
            if (this.pairRoots?.left !== undefined && this.pairRoots.right !== undefined) {
                const pairLeftSymbol = this.tokensCache.get(this.pairRoots.left.toString())?.symbol
                const pairRightSymbol = this.tokensCache.get(this.pairRoots.right.toString())?.symbol
                if (pairLeftSymbol !== undefined && pairRightSymbol !== undefined) {
                    name = concatSymbols(pairLeftSymbol, pairRightSymbol)
                }
            }

            this.favoritePairs.add(this.pairAddress, name)
        }

        const share = new BigNumber(input.result.step_1_lp_reward.toString())
            .plus(new BigNumber(input.result.step_3_lp_reward.toString()))
            .toFixed()

        const sharePercent = this.isPoolEmpty
            ? '100.0'
            : new BigNumber(share)
                .plus(this.lpWalletBalance || 0)
                .multipliedBy(100)
                .dividedBy(new BigNumber(pairLpBalance).plus(share))
                .decimalPlaces(8, BigNumber.ROUND_DOWN)
                .toFixed()

        const currentSharePercent = this.isPoolEmpty
            ? '0.0'
            : new BigNumber(this.lpWalletBalance || 0)
                .multipliedBy(100)
                .dividedBy(new BigNumber(pairLpBalance))
                .decimalPlaces(8, BigNumber.ROUND_DOWN)
                .toFixed()

        const shareChangePercent = this.isPoolEmpty
            ? '100.0'
            : new BigNumber(sharePercent)
                .minus(currentSharePercent)
                .decimalPlaces(8, BigNumber.ROUND_DOWN)
                .toFixed()

        let leftBN = new BigNumber(input.result.step_1_left_deposit).plus(input.result.step_3_left_deposit),
            rightBN = new BigNumber(input.result.step_1_right_deposit).plus(input.result.step_3_right_deposit)

        if (input.result.step_2_left_to_right) {
            leftBN = leftBN.plus(input.result.step_2_spent)
            rightBN = rightBN.minus(input.result.step_2_received)
        }

        if (input.result.step_2_right_to_left) {
            rightBN = rightBN.plus(input.result.step_2_spent)
            leftBN = leftBN.minus(input.result.step_2_received)
        }

        const isInverted = this.pairRoots.left.toString() !== this.leftToken.root

        const leftDecimals = this.leftToken.decimals
        const rightDecimals = this.rightToken.decimals

        const leftDeposit = isInverted ? rightBN.toFixed() : leftBN.toFixed()
        const rightDeposit = isInverted ? leftBN.toFixed() : rightBN.toFixed()

        const newLeftBN = new BigNumber(pairLeftBalance).plus(leftDeposit)
        const newRightBN = new BigNumber(pairRightBalance).plus(rightDeposit)

        const newLeft = newLeftBN.toFixed()
        const newRight = newRightBN.toFixed()

        const newLeftPrice = newLeftBN.shiftedBy(-leftDecimals)
            .dividedBy(newRightBN.shiftedBy(-rightDecimals))
            .decimalPlaces(leftDecimals, BigNumber.ROUND_UP)
            .toFixed()
        const newRightPrice = newRightBN.shiftedBy(-rightDecimals)
            .dividedBy(newLeftBN.shiftedBy(-leftDecimals))
            .decimalPlaces(rightDecimals, BigNumber.ROUND_UP)
            .toFixed()

        runInAction(() => {
            this.depositLiquidityReceipt = {
                success: true,
                successData: {
                    leftDecimals,
                    rightDecimals,
                    leftDeposit,
                    rightDeposit,
                    hash: transaction.id.hash,
                    leftSymbol,
                    rightSymbol,
                    lpDecimals: this.lpDecimals!,
                    lpRoot: this.lpRoot!,
                    newLeft,
                    newRight,
                    newLeftPrice,
                    newRightPrice,
                    currentSharePercent,
                    share,
                    shareChangePercent,
                    sharePercent,
                },
                errorData: undefined,
            }

            this.data.leftAmount = ''
            this.data.rightAmount = ''
        })

        this.setStep(AddLiquidityStep.CHECK_PAIR)
        this.unsubscribeTransactionSubscriber().catch(reason => error(reason))
    }

    /**
     * Failure transaction callback handler
     * @param _
     * @protected
     */
    protected handleLiquidityFailure(_?: DepositLiquidityFailureResult): void {
        if (!this.leftToken || !this.rightToken) {
            return
        }

        runInAction(() => {
            this.depositLiquidityReceipt = {
                success: false,
                errorData: {
                    leftSymbol: (this.leftToken as TokenCache).symbol,
                    rightSymbol: (this.rightToken as TokenCache).symbol,
                },
                successData: undefined,
            }

            this.data.leftAmount = ''
            this.data.rightAmount = ''
        })

        this.setState('isDepositingLiquidity', false)
    }

    /*
     * Steps handlers
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @returns {Promise<void>}
     * @protected
     */
    protected handleInitStep(): void {
        this.resetPoolData()
        this.setStep(AddLiquidityStep.CHECK_ACCOUNT)
    }

    /**
     *
     * @returns {Promise<void>}
     * @protected
     */
    protected async handleCheckDexAccountStep(): Promise<void> {
        try {
            await this.dex.connectAndSync()
        }
        catch (e) {
            error('DEX account connect and sync error', e)
        }

        if (!this.dex.address) {
            this.setStep(AddLiquidityStep.CONNECT_ACCOUNT)
            return
        }

        if (this.leftToken && this.rightToken) {
            this.setStep(AddLiquidityStep.CHECK_PAIR)
        }
        else {
            this.setStep(AddLiquidityStep.SELECT_PAIR)
        }
    }

    /**
     *
     * @returns {Promise<void>}
     * @protected
     */
    protected async handleConnectingDexAccountStep(): Promise<void> {
        const check = debounce(async () => {
            if (this.dex.address) {
                this.setStep(AddLiquidityStep.CHECK_PAIR)
                return
            }

            try {
                await this.dex.connect()
                if (this.dex.address !== undefined) {
                    this.setStep(AddLiquidityStep.CHECK_PAIR)
                }
            }
            catch (e) {
                this.setStep(AddLiquidityStep.CONNECT_ACCOUNT)
            }
            finally {
                if (
                    !this.dex.address
                    && this.step === AddLiquidityStep.CONNECTING_ACCOUNT
                ) {
                    check()
                }
            }
        }, 5000)

        check()
    }

    /**
     *
     * @returns {Promise<void>}
     * @protected
     */
    protected async handleCheckPairStep(): Promise<void> {
        if (!this.leftToken || !this.rightToken) {
            this.setStep(AddLiquidityStep.SELECT_PAIR)
            return
        }

        try {
            const address = await checkPair(this.leftToken.root, this.rightToken.root)
            this.changePoolData('pair', { address: address?.toString() })
        }
        catch (e) {
            error(e)
        }

        if (!this.pairAddress) {
            this.setStep(AddLiquidityStep.CREATE_POOL)
            return
        }

        try {
            const address = await Dex.pairLpRoot(new Address(this.pairAddress))
            this.changePoolData('lpRoot', address.toString())
        }
        catch (e) {}

        if (!this.dex.address) {
            this.setStep(AddLiquidityStep.INIT)
            return
        }

        try {
            await this.dex.syncWallets()
            await this.dex.syncBalances()
        }
        catch (e) {}

        await this.syncLpBalance()
        await this.syncPairRoots()
        await this.syncPairBalances()

        if (this.isPoolEmpty === false) {
            const leftDecimals = this.leftToken.decimals
            const rightDecimals = this.rightToken.decimals

            const leftBN = new BigNumber(this.pairBalances?.left || 0).shiftedBy(-leftDecimals)
            const rightBN = new BigNumber(this.pairBalances?.right || 0).shiftedBy(-rightDecimals)

            this.changePoolData(
                'leftPrice',
                leftBN.dividedBy(rightBN).decimalPlaces(leftDecimals, BigNumber.ROUND_UP).toFixed(),
            )
            this.changePoolData(
                'rightPrice',
                rightBN.dividedBy(leftBN).decimalPlaces(rightDecimals, BigNumber.ROUND_UP).toFixed(),
            )

            this.updateAmount()
        }

        if (
            !this.dex.getAccountWallet(this.leftToken?.root)
            || !this.dex.getAccountWallet(this.rightToken?.root)
            || !this.dex.getAccountWallet(this.lpRoot)
        ) {
            this.setStep(AddLiquidityStep.CONNECT_POOL)
            return
        }

        this.setStep(AddLiquidityStep.DEPOSIT_LIQUIDITY)
    }

    /**
     *
     * @returns {Promise<void>}
     * @protected
     */
    protected async handleCreatingPoolStep(): Promise<void> {
        if (!this.leftToken || !this.rightToken) {
            this.setStep(AddLiquidityStep.SELECT_PAIR)
            return
        }

        const check = debounce(async () => {
            if (
                !this.leftToken
                || !this.rightToken
                || this.step !== AddLiquidityStep.CREATING_POOL
            ) {
                return
            }

            try {
                const address = await checkPair(this.leftToken.root, this.rightToken.root)
                if (address !== undefined) {
                    this.changePoolData('pair', {
                        ...this.pool.pair,
                        address: address.toString(),
                    })

                    this.setStep(AddLiquidityStep.CHECK_PAIR)
                }
            }
            catch (e) {
                this.setStep(AddLiquidityStep.CHECK_PAIR)
            }
            finally {
                if (
                    !this.pairAddress
                    && this.step === AddLiquidityStep.CREATING_POOL
                ) {
                    check()
                }
            }
        }, 5000)

        check()
    }

    /**
     *
     * @returns {Promise<void>}
     * @protected
     */
    protected async handleConnectingPoolStep(): Promise<void> {
        if (
            !this.leftToken
            || !this.rightToken
            || !this.lpRoot
            || !this.dex.address
        ) {
            this.setStep(AddLiquidityStep.CHECK_PAIR)
            return
        }

        const check = debounce(async () => {
            if (
                !this.leftToken
                || !this.rightToken
                || !this.lpRoot
                || !this.dex.address
                || this.step !== AddLiquidityStep.CONNECTING_POOL
            ) {
                return
            }

            try {
                await this.dex.syncWallets()
            }
            catch (e) {
                this.setStep(AddLiquidityStep.CHECK_PAIR)
            }
            finally {
                if (
                    !this.dex.getAccountWallet(this.leftToken?.root)
                    || !this.dex.getAccountWallet(this.rightToken?.root)
                    || !this.dex.getAccountWallet(this.lpRoot)
                ) {
                    check()
                }
                else if (this.step === AddLiquidityStep.CONNECTING_POOL) {
                    this.setStep(AddLiquidityStep.DEPOSIT_LIQUIDITY)
                }
            }
        }, 5000)

        check()
    }

    /*
     * Internal utilities methods
     * ----------------------------------------------------------------------------------
     */

    /**
     * Try to unsubscribe from transaction subscriber
     * @protected
     */
    protected async unsubscribeTransactionSubscriber(): Promise<void> {
        if (this.#transactionSubscriber !== undefined) {
            try {
                await this.#transactionSubscriber.unsubscribe()
            }
            catch (e) {
                error('Transaction unsubscribe error', e)
            }

            this.#transactionSubscriber = undefined
        }
    }

    /**
     *
     * @param {K} key
     * @param {PoolData[K]} value
     * @protected
     */
    protected changePoolData<K extends keyof PoolData>(key: K, value: PoolData[K]): void {
        this.pool[key] = value
    }

    /**
     *
     * @param {AddLiquidityStep} [step]
     * @protected
     */
    protected setStep(step?: AddLiquidityStep): void {
        this.setState('step', step)
    }

    /**
     *
     * @param {K} key
     * @param {PoolStoreData[K]} value
     * @protected
     */
    public changeAmount<K extends keyof PoolStoreData>(key: K, value: PoolStoreData[K]): void {
        this.setData(key, value)

        if (this.isPoolEmpty) {
            this.syncPoolShare().catch(reason => error(reason))
            return
        }

        if (this.isAutoExchangeEnabled) {
            this.syncPoolShare().catch(reason => error(reason))
            return
        }

        const getAmount = (price: string, amount: string, decimals: number) => (
            new BigNumber(price || 0).multipliedBy(amount).decimalPlaces(decimals, BigNumber.ROUND_UP)
        )

        if (key === 'leftAmount' && this.isLeftAmountValid && this.rightToken) {
            const right = getAmount(this.rightPrice || '0', this.leftAmount, this.rightToken?.decimals)

            if (isGoodBignumber(right)) {
                this.setData('rightAmount', right.toFixed())
            }
            else {
                this.setData('rightAmount', '')
            }
        }
        else if (key === 'rightAmount' && this.isRightAmountValid && this.leftToken) {
            const left = getAmount(this.leftPrice || '0', this.rightAmount, this.leftToken.decimals)

            if (isGoodBignumber(left)) {
                this.setData('leftAmount', left.toFixed())
            }
            else {
                this.setData('leftAmount', '')
            }
        }
    }

    /**
     *
     * @protected
     */
    protected updateAmount(): void {
        if (this.isLeftAmountValid) {
            this.changeAmount('leftAmount', this.leftAmount)
        }
        else if (this.isRightAmountValid) {
            this.changeAmount('rightAmount', this.rightAmount)
        }
    }

    /**
     *
     * @returns {Promise<void>}
     * @protected
     */
    protected async syncPairBalances(): Promise<void> {
        if (!this.pairAddress || this.isSyncPairBalances) {
            return
        }

        this.setState('isSyncPairBalances', true)

        try {
            const { left, lp, right } = await Dex.pairBalances(new Address(this.pairAddress))
            const isInverted = this.pairRoots?.left.toString() !== this.leftToken?.root

            this.changePoolData('pair', {
                ...this.pool.pair,
                balances: {
                    left: isInverted ? right : left,
                    lp,
                    right: isInverted ? left : right,
                },
            })
            this.changePoolData('isPoolEmpty', lp === '0')
        }
        catch (e) {
            error('DEX account balances error', e)
        }
        finally {
            this.setState('isSyncPairBalances', false)
        }
    }

    /**
     *
     * @returns {Promise<void>}
     * @protected
     */
    protected async syncPairRoots(): Promise<void> {
        if (!this.pairAddress || this.isSyncPairRoots) {
            return
        }

        this.setState('isSyncPairRoots', true)

        try {
            const roots = await Dex.pairTokenRoots(new Address(this.pairAddress))
            this.changePoolData('pair', {
                ...this.pool.pair,
                roots,
            })

            if (this.pairRoots?.left.toString() !== this.leftToken?.root && this.pairBalances) {
                const { left, lp, right } = this.pairBalances
                this.changePoolData('pair', {
                    ...this.pool.pair,
                    balances: {
                        lp,
                        left: right,
                        right: left,
                    },
                })
            }
        }
        catch (e) {
            error('DEX account roots error', e)
        }
        finally {
            this.setState('isSyncPairRoots', false)
        }
    }

    /**
     *
     * @returns {Promise<void>}
     * @protected
     */
    protected async syncLpBalance(): Promise<void> {
        if (!this.lpRoot) {
            return
        }

        if (!this.lpDecimals) {
            try {
                const decimals = await TokenWallet.getDecimals(new Address(this.lpRoot))
                this.changePoolData('lpDecimals', !decimals ? undefined : decimals)
            }
            catch (e) {
                error('LP Wallet decimals error', e)
            }
        }

        this.changePoolData('lpBalance', this.dex.balances?.get(this.lpRoot as string) || '0')

        if (!this.lpWalletAddress && this.wallet.address) {
            try {
                const address = await TokenWallet.walletAddress({
                    root: new Address(this.lpRoot),
                    owner: new Address(this.wallet.address),
                })
                this.changePoolData('lpWalletAddress', address.toString())
            }
            catch (e) {
                error('LP Wallet address error', e)
                this.changePoolData('lpWalletAddress', undefined)
            }
        }

        if (this.lpWalletAddress) {
            try {
                const balance = await TokenWallet.balance({
                    wallet: new Address(this.lpWalletAddress),
                })
                this.changePoolData('lpWalletBalance', balance)
            }
            catch (e) {
                error('LP Wallet balance error', e)
                this.changePoolData('lpWalletBalance', undefined)
            }
        }
    }

    /**
     *
     * @returns {Promise<void>}
     * @protected
     */
    protected async syncPoolShare(): Promise<void> {
        if (
            !this.pairAddress
            || !this.pairRoots
            || !this.leftToken
            || !this.rightToken
        ) {
            return
        }

        const leftAmount = new BigNumber(this.leftAmount || 0)
            .shiftedBy(this.leftToken.decimals)
            .decimalPlaces(0)
            .toFixed()

        const rightAmount = new BigNumber(this.rightAmount || 0)
            .shiftedBy(this.rightToken.decimals)
            .decimalPlaces(0)
            .toFixed()

        const isInverted = this.pairRoots.left.toString() !== this.leftToken.root
        const left = isInverted ? rightAmount : leftAmount
        const right = isInverted ? leftAmount : rightAmount

        try {
            const result = await Dex.pairExpectedDepositLiquidity(
                new Address(this.pairAddress),
                this.isAutoExchangeEnabled,
                left,
                right,
            )

            this.changePoolData('share', new BigNumber(result.step_1_lp_reward.toString())
                .plus(new BigNumber(result.step_3_lp_reward.toString()))
                .toFixed())

            const pairLp = this.pairBalances?.lp
            const pairLeft = this.pairBalances?.left || '0'
            const pairRight = this.pairBalances?.right || '0'

            if (this.lpRoot && pairLp !== undefined) {
                if (this.isPoolEmpty) {
                    this.changePoolData('sharePercent', '100.0')
                    this.changePoolData('currentSharePercent', '0.0')
                    this.changePoolData('currentShareLeft', '0.0')
                    this.changePoolData('currentShareRight', '0.0')
                    this.changePoolData('shareChangePercent', '100.0')
                }
                else {
                    this.changePoolData(
                        'sharePercent',
                        new BigNumber(this.poolShare || 0)
                            .plus(this.lpWalletBalance || 0)
                            .multipliedBy(100)
                            .dividedBy(new BigNumber(pairLp).plus(this.poolShare || 0))
                            .decimalPlaces(8, BigNumber.ROUND_DOWN)
                            .toFixed(),
                    )
                    this.changePoolData(
                        'currentSharePercent',
                        new BigNumber(this.lpWalletBalance || 0)
                            .multipliedBy(100)
                            .dividedBy(new BigNumber(pairLp))
                            .decimalPlaces(8, BigNumber.ROUND_DOWN)
                            .toFixed(),
                    )

                    if (this.leftToken !== undefined) {
                        this.changePoolData(
                            'currentShareLeft',
                            new BigNumber(this.lpWalletBalance || 0)
                                .times(new BigNumber(isInverted ? pairRight : pairLeft))
                                .dividedBy(new BigNumber(pairLp))
                                .decimalPlaces(0, BigNumber.ROUND_DOWN)
                                .shiftedBy(-this.leftToken.decimals)
                                .toFixed(),
                        )
                    }

                    if (this.rightToken !== undefined) {
                        this.changePoolData(
                            'currentShareRight',
                            new BigNumber(this.lpWalletBalance || '0')
                                .times(new BigNumber(isInverted ? pairLeft : pairRight))
                                .dividedBy(new BigNumber(pairLp))
                                .decimalPlaces(0, BigNumber.ROUND_DOWN)
                                .shiftedBy(-this.rightToken.decimals)
                                .toFixed(),
                        )
                    }

                    this.changePoolData(
                        'shareChangePercent',
                        new BigNumber(this.sharePercent || 0)
                            .minus(this.currentSharePercent || 0)
                            .decimalPlaces(8, BigNumber.ROUND_DOWN)
                            .toFixed(),
                    )
                }


                let leftBN = new BigNumber(result.step_1_left_deposit).plus(result.step_3_left_deposit),
                    rightBN = new BigNumber(result.step_1_right_deposit).plus(result.step_3_right_deposit)

                if (result.step_2_left_to_right) {
                    leftBN = leftBN.plus(result.step_2_spent)
                    rightBN = rightBN.minus(result.step_2_received)
                }

                if (result.step_2_right_to_left) {
                    rightBN = rightBN.plus(result.step_2_spent)
                    leftBN = leftBN.minus(result.step_2_received)
                }

                this.changePoolData('leftDeposit', isInverted ? rightBN.toFixed() : leftBN.toFixed())
                this.changePoolData('rightDeposit', isInverted ? leftBN.toFixed() : rightBN.toFixed())

                const newLeftBN = new BigNumber(pairLeft).plus(this.leftDeposit || 0)
                const newRightBN = new BigNumber(pairRight).plus(this.rightDeposit || 0)

                this.changePoolData('newLeft', newLeftBN.toFixed())
                this.changePoolData('newRight', newRightBN.toFixed())

                if (this.leftToken && this.rightToken) {
                    this.changePoolData(
                        'newLeftPrice',
                        newLeftBN
                            .shiftedBy(-this.leftToken.decimals)
                            .dividedBy(newRightBN.shiftedBy(-this.rightToken.decimals))
                            .decimalPlaces(this.leftToken.decimals, BigNumber.ROUND_UP)
                            .toFixed(),
                    )

                    this.changePoolData(
                        'newRightPrice',
                        newRightBN
                            .shiftedBy(-this.rightToken.decimals)
                            .dividedBy(newLeftBN.shiftedBy(-this.leftToken.decimals))
                            .decimalPlaces(this.rightToken.decimals, BigNumber.ROUND_UP)
                            .toFixed(),
                    )
                }
            }
            else {
                this.changePoolData('sharePercent', undefined)
                this.changePoolData('shareChangePercent', undefined)
                this.changePoolData('currentSharePercent', undefined)
                this.changePoolData('newLeft', undefined)
                this.changePoolData('newRight', undefined)
                this.changePoolData('newLeftPrice', undefined)
                this.changePoolData('newRightPrice', undefined)
                this.changePoolData('leftDeposit', undefined)
                this.changePoolData('rightDeposit', undefined)
            }
        }
        catch (e) {
            error('PoolStoreSingleton share sync error', e)
        }
    }

    /**
     *
     * @protected
     */
    protected reset(): void {
        this.resetData()
        this.resetPoolData()
        this.resetState()
    }

    /**
     *
     * @protected
     */
    protected resetData(): void {
        this.setData(() => DEFAULT_POOL_STORE_DATA)
    }

    /**
     *
     * @protected
     */
    protected resetPoolData(): void {
        this.pool = DEFAULT_POOL_DATA
    }

    /**
     *
     * @protected
     */
    protected resetState(): void {
        this.setState(() => DEFAULT_POOL_STORE_STATE)
    }

    /*
     * Computed states
     * ----------------------------------------------------------------------------------
     */

    public get isAutoExchangeAvailable(): boolean {
        return (
            !this.isPoolEmpty
            && this.leftToken !== undefined
            && this.rightToken !== undefined
            && this.step === AddLiquidityStep.DEPOSIT_LIQUIDITY
        )
    }

    public get isDexAccountDataAvailable(): boolean {
        return (
            this.dex.address !== undefined
            && this.wallet.address !== undefined
            && (this.leftToken !== undefined || this.rightToken !== undefined)
        )
    }

    public get isPoolDataAvailable(): boolean {
        return (
            this.pairAddress !== undefined
            && this.pairBalances !== undefined
            && this.leftToken !== undefined
            && this.rightToken !== undefined
            && this.step !== AddLiquidityStep.CHECK_PAIR
        )
    }

    public get isPoolShareDataAvailable(): boolean {
        return (
            this.leftToken !== undefined
            && this.rightToken !== undefined
            && this.isSupplyComputeReady
        )
    }

    public get isSupplyComputeReady(): boolean {
        if (this.isAutoExchangeEnabled) {
            return this.isLeftAmountValid || this.isRightAmountValid
        }
        return this.isLeftAmountValid && this.isRightAmountValid
    }

    public get isSupplyReady(): boolean {
        return this.isAutoExchangeEnabled
            ? (
                (
                    this.isLeftAmountValid
                    && this.isDexLeftBalanceValid
                )
                || (
                    this.isRightAmountValid
                    && this.isDexRightBalanceValid
                )
                || (
                    this.isLeftAmountValid
                    && this.isRightAmountValid
                    && this.isDexLeftBalanceValid
                    && this.isDexRightBalanceValid
                )
            )
            : (
                this.isLeftAmountValid
                && this.isRightAmountValid
                && this.isDexLeftBalanceValid
                && this.isDexRightBalanceValid
            )
    }

    /*
     * Computed Dex states and values
     * ----------------------------------------------------------------------------------
     */

    public get dexLeftBalance(): string | undefined {
        return this.leftToken && this.dex.balances?.get(this.leftToken?.root)
    }

    public get isDexLeftBalanceValid(): boolean {
        if (!this.leftToken || this.dexLeftBalance === undefined) {
            return false
        }

        const leftAmount = new BigNumber(this.leftAmount || 0).shiftedBy(this.leftToken.decimals ?? DEFAULT_DECIMALS)
        return leftAmount.lte(this.dexLeftBalance)
    }

    public get isLeftTokenWithdrawAvailable(): boolean {
        return this.dexLeftBalance !== undefined && this.dexLeftBalance !== '0'
    }

    public get dexRightBalance(): string | undefined {
        return this.rightToken && this.dex.balances?.get(this.rightToken?.root)
    }

    public get isDexRightBalanceValid(): boolean {
        if (!this.rightToken || this.dexRightBalance === undefined) {
            return false
        }

        const rightAmount = new BigNumber(this.rightAmount || 0).shiftedBy(this.rightToken.decimals ?? DEFAULT_DECIMALS)
        return rightAmount.lte(this.dexRightBalance)
    }

    public get isRightTokenWithdrawAvailable(): boolean {
        return this.dexRightBalance !== undefined && this.dexRightBalance !== '0'
    }

    public get transaction(): DepositLiquidityReceipt | undefined {
        return this.depositLiquidityReceipt
    }

    public get isWithdrawLpAvailable(): boolean {
        return this.lpBalance !== undefined && this.lpBalance !== '0'
    }

    public get isWithdrawLiquidityAvailable(): boolean {
        return this.lpWalletBalance !== undefined && this.lpWalletBalance !== '0'
    }

    /*
     * Memoized store data values
     * ----------------------------------------------------------------------------------
     */

    public get isLeftAmountValid(): boolean {
        return isGoodBignumber(new BigNumber(this.leftAmount))
    }

    public get isRightAmountValid(): boolean {
        return isGoodBignumber(new BigNumber(this.rightAmount))
    }

    public get leftAmount(): PoolStoreData['leftAmount'] {
        return this.data.leftAmount
    }

    public get leftToken(): TokenCache | undefined {
        // Note: should use only accepted tokens
        return this.tokensCache.tokens.find(({ root }) => root === this.data.leftToken)
    }

    public get rightAmount(): PoolStoreData['rightAmount'] {
        return this.data.rightAmount
    }

    public get rightToken(): TokenCache | undefined {
        // Note: should use only accepted tokens
        return this.tokensCache.tokens.find(({ root }) => root === this.data.rightToken)
    }

    public get formattedLeftBalance(): string {
        if (this.leftToken?.decimals === undefined) {
            return '0'
        }
        return formattedBalance(this.leftToken?.balance, this.leftToken.decimals, this.dexLeftBalance)
    }

    public get formattedRightBalance(): string {
        if (this.rightToken?.decimals === undefined) {
            return '0'
        }
        return formattedBalance(this.rightToken?.balance, this.rightToken.decimals, this.dexRightBalance)
    }

    /*
     * Memoized store state values
     * ----------------------------------------------------------------------------------
     */

    public get isAutoExchangeEnabled(): PoolStoreState['isAutoExchangeEnabled'] {
        return this.state.isAutoExchangeEnabled
    }

    public get isDepositingLeft(): PoolStoreState['isDepositingLeft'] {
        return this.state.isDepositingLeft
    }

    public get isDepositingLiquidity(): PoolStoreState['isDepositingLiquidity'] {
        return this.state.isDepositingLiquidity
    }

    public get isDepositingRight(): PoolStoreState['isDepositingRight'] {
        return this.state.isDepositingRight
    }

    public get isPreparing(): PoolStoreState['isPreparing'] {
        return this.state.isPreparing
    }

    public get isSyncPairBalances(): PoolStoreState['isSyncPairBalances'] {
        return this.state.isSyncPairBalances
    }

    public get isSyncPairRoots(): PoolStoreState['isSyncPairRoots'] {
        return this.state.isSyncPairRoots
    }

    public get isWithdrawingLeftToken(): PoolStoreState['isWithdrawingLeft'] {
        return this.state.isWithdrawingLeft
    }

    public get isWithdrawingLiquidity(): PoolStoreState['isWithdrawingLiquidity'] {
        return this.state.isWithdrawingLiquidity
    }

    public get isWithdrawingRightToken(): PoolStoreState['isWithdrawingRight'] {
        return this.state.isWithdrawingRight
    }

    public get step(): PoolStoreState['step'] {
        return this.state.step
    }

    /*
     * Memoized pool data values
     * ----------------------------------------------------------------------------------
     */

    public get isPoolEmpty(): PoolData['isPoolEmpty'] {
        return this.pool.isPoolEmpty
    }

    public get lpBalance(): PoolData['lpBalance'] {
        return this.pool.lpBalance
    }

    public get lpDecimals(): PoolData['lpDecimals'] {
        return this.pool.lpDecimals
    }

    public get lpRoot(): PoolData['lpRoot'] {
        return this.pool.lpRoot
    }

    public get lpWalletAddress(): PoolData['lpWalletAddress'] {
        return this.pool.lpWalletAddress
    }

    public get lpWalletBalance(): PoolData['lpWalletBalance'] {
        return this.pool.lpWalletBalance
    }

    public get poolShare(): PoolData['share'] {
        return this.pool.share
    }

    public get sharePercent(): PoolData['sharePercent'] {
        return this.pool.sharePercent
    }

    public get shareChangePercent(): PoolData['shareChangePercent'] {
        return this.pool.shareChangePercent
    }

    public get currentShareLeft(): PoolData['currentShareLeft'] {
        return this.pool.currentShareLeft
    }

    public get currentSharePercent(): PoolData['currentSharePercent'] {
        return this.pool.currentSharePercent
    }

    public get currentShareRight(): PoolData['currentShareRight'] {
        return this.pool.currentShareRight
    }

    public get leftPrice(): PoolData['leftPrice'] {
        return this.pool.leftPrice
    }

    public get rightPrice(): PoolData['rightPrice'] {
        return this.pool.rightPrice
    }

    public get newLeftPrice(): PoolData['newLeftPrice'] {
        return this.pool.newLeftPrice
    }

    public get newRightPrice(): PoolData['newRightPrice'] {
        return this.pool.newRightPrice
    }

    public get leftDeposit(): PoolData['leftDeposit'] {
        return this.pool.leftDeposit
    }

    public get rightDeposit(): PoolData['rightDeposit'] {
        return this.pool.rightDeposit
    }

    public get pair(): PoolData['pair'] {
        return this.pool.pair
    }

    public get pairAddress(): string | undefined {
        return this.pair?.address
    }

    public get pairBalances(): PairBalances | undefined {
        return this.pair?.balances
    }

    public get pairRoots(): PairTokenRoots | undefined {
        return this.pair?.roots
    }

    public get useTokensCache(): TokensCacheService {
        return this.tokensCache
    }

    /**
     * Internal pool transaction subscriber
     * @type {Subscriber}
     * @protected
     */
    #transactionSubscriber: Subscriber | undefined

    /*
     * Internal reaction disposers
     * ----------------------------------------------------------------------------------
     */

    #dexBalancesUpdatesDisposer: IReactionDisposer | undefined

    #dexLeftBalanceValidationDisposer: IReactionDisposer | undefined

    #dexRightBalanceValidationDisposer: IReactionDisposer | undefined

    #lpBalanceDisposer: IReactionDisposer | undefined

    #stepDisposer: IReactionDisposer | undefined

    #tokensDisposer: IReactionDisposer | undefined

    #walletAccountDisposer: IReactionDisposer | undefined

}


const PoolStoreSingleton = new PoolStore(
    useWallet(),
    useTokensCache(),
    useDexAccount(),
    useFavoritePairs(),
)

export function usePoolStore(): PoolStore {
    return PoolStoreSingleton
}
