import BigNumber from 'bignumber.js'
import * as E from 'fp-ts/Either'
import isEqual from 'lodash.isequal'
import {
    IReactionDisposer,
    action,
    makeAutoObservable,
    reaction,
} from 'mobx'
import ton, { Address, Contract, Subscriber } from 'ton-inpage-provider'

import {
    checkPair,
    Dex,
    DexAbi,
    PairBalances,
    PairTokenRoots,
    TokenWallet,
} from '@/misc'
import { DEFAULT_POOL_DATA, DEFAULT_POOL_STORE_DATA, DEFAULT_POOL_STORE_STATE } from '@/modules/Pool/constants'
import {
    AddLiquidityStep,
    DepositLiquidityErrorDataProp,
    DepositLiquidityFailureResult,
    DepositLiquidityResult,
    DepositLiquiditySuccessDataProp,
    DepositLiquiditySuccessResult,
    PoolData,
    PoolDataProp,
    PoolPairProp,
    PoolStoreData,
    PoolStoreDataProp,
    PoolStoreState,
    PoolStoreStateProp,
    TokenSide,
} from '@/modules/Pool/types'
import { DexAccountService, useDexAccount } from '@/stores/DexAccountService'
import { TokenCache } from '@/stores/TokensCacheService'
import { useWallet, WalletService } from '@/stores/WalletService'
import { debounce, error, isAmountValid } from '@/utils'


export class PoolStore {

    /**
     * Current data of the liquidity pool form
     * @type {PoolStoreData}
     * @protected
     */
    protected data: PoolStoreData = DEFAULT_POOL_STORE_DATA

    /**
     * Current data of the liquidity pool
     * @type {PoolData}
     * @protected
     */
    protected pool: PoolData = DEFAULT_POOL_DATA

    /**
     * Current state of the liquidity pool store
     * @type {PoolStoreState}
     * @protected
     */
    protected state: PoolStoreState = DEFAULT_POOL_STORE_STATE

    /**
     * Last deposit liquidity transaction result data
     * @type {DepositLiquidityResult | undefined}
     * @protected
     */
    protected depositLiquidityResult: DepositLiquidityResult | undefined = undefined

    /**
     * Internal pool transaction subscriber
     * @type {Subscriber}
     * @protected
     */
    protected transactionSubscriber: Subscriber | undefined

    constructor(
        protected readonly wallet: WalletService,
        protected readonly dex: DexAccountService,
    ) {
        makeAutoObservable<
            PoolStore,
            | 'handleLpBalanceChange'
            | 'handleTokensChange'
            | 'handleStepChange'
            | 'handleWalletAddressChange'
        >(this, {
            changeData: action.bound,
            handleLpBalanceChange: action.bound,
            handleTokensChange: action.bound,
            handleStepChange: action.bound,
            handleWalletAddressChange: action.bound,
        })
    }

    /*
     * External actions for use it in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     * Manually change data by the given key
     * @template K
     * @param {K} key
     * @param {PoolStoreData[K]} value
     */
    public changeData<K extends keyof PoolStoreData>(key: K, value: PoolStoreData[K]): void {
        if ([PoolStoreDataProp.LEFT_AMOUNT, PoolStoreDataProp.RIGHT_AMOUNT].includes(key)) {
            this.changeAmount(key, value)
        }
        else {
            this.data[key] = value
        }
    }

    /**
     * Manually init all necessary subscribers.
     * Toggle to initial step.
     */
    public async init(): Promise<void> {
        if (this.transactionSubscriber !== undefined) {
            await this.transactionSubscriber.unsubscribe()
            this.transactionSubscriber = undefined
        }

        this.transactionSubscriber = new Subscriber(ton)

        this.#dexLeftBalanceValidationDisposer = reaction(() => this.isDexLeftBalanceValid, value => {
            if (value) {
                this.changeState(PoolStoreStateProp.IS_DEPOSITING_LEFT, false)
            }
        })

        this.#dexRightBalanceValidationDisposer = reaction(() => this.isDexRightBalanceValid, value => {
            if (value) {
                this.changeState(PoolStoreStateProp.IS_DEPOSITING_RIGHT, false)
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
            () => [this.leftToken, this.rightToken],
            debounce(this.handleTokensChange, 200),
        )

        this.#walletAccountDisposer = reaction(() => this.wallet.address, this.handleWalletAddressChange)

        if (this.wallet.address) {
            this.handleStepChange(undefined).then(() => {
                this.setStep(AddLiquidityStep.INIT)
            })
        }
    }

    /**
     * Manually dispose all of the internal subscribers.
     * Reset all data to their defaults.
     * Stop DEX account balances updater
     */
    public async dispose(): Promise<void> {
        if (this.transactionSubscriber !== undefined) {
            await this.transactionSubscriber.unsubscribe()
            this.transactionSubscriber = undefined
        }
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
        this.changeState(
            PoolStoreStateProp.IS_AUTO_EXCHANGE_ENABLE,
            !this.isAutoExchangeEnable,
        )

        if (!this.isAutoExchangeEnable) {
            this.updateAmount()
        }
    }

    /**
     * Manually connect to a Dex account
     */
    public connectDexAccount(): void {
        if (!this.wallet.address) {
            return
        }

        this.dex.connectOrCreate().catch(err => {
            error('Create account error', err)
            this.setStep(AddLiquidityStep.CONNECT_ACCOUNT)
        })

        this.setStep(AddLiquidityStep.CONNECTING_ACCOUNT)
    }

    /**
     * Manually request to create pairs pool
     */
    public createPool(): void {
        if (
            !this.leftToken
            || !this.rightToken
            || !this.wallet.address
        ) {
            return
        }

        Dex.createPair(
            new Address(this.leftToken.root),
            new Address(this.rightToken.root),
            new Address(this.wallet.address),
        ).catch(err => {
            error('Create pair error', err)
            this.setStep(AddLiquidityStep.CHECK_PAIR)
        })

        this.setStep(AddLiquidityStep.CREATING_POOL)
    }

    /**
     * Manually request to connect to pool
     */
    public connectPool(): void {
        if (
            !this.leftToken
            || !this.rightToken
            || !this.wallet.address
            || !this.dex.address
        ) {
            return
        }

        Dex.connectPair(
            new Address(this.dex.address),
            new Address(this.leftToken.root),
            new Address(this.rightToken.root),
            new Address(this.wallet.address),
        ).catch(err => {
            error('Connect pair error', err)
            this.setStep(AddLiquidityStep.CHECK_PAIR)
        })

        this.setStep(AddLiquidityStep.CONNECTING_POOL)
    }

    /**
     * Manually sync pool share
     */
    public async fetchPoolShare(): Promise<void> {
        await this.syncPoolShare()
    }

    /**
     * Manually deposit token by the given token side.
     * @param {TokenSide} side
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

        if (side === PoolStoreDataProp.LEFT_TOKEN) {
            amount = this.leftAmount
            dexBalance = this.dexLeftBalance
            this.changeState(PoolStoreStateProp.IS_DEPOSITING_LEFT, true)
        }
        else if (side === PoolStoreDataProp.RIGHT_TOKEN) {
            amount = this.rightAmount
            dexBalance = this.dexRightBalance
            this.changeState(PoolStoreStateProp.IS_DEPOSITING_RIGHT, true)
        }

        const delta = new BigNumber(amount || '0')
            .shiftedBy(token.decimals)
            .minus(dexBalance || '0')
            .decimalPlaces(0, BigNumber.ROUND_UP)

        if (
            !delta.isPositive()
            || delta.isZero()
            || !delta.isFinite()
            || delta.isNaN()
        ) {
            return
        }

        await TokenWallet.send({
            address: new Address(token.root),
            recipient,
            owner: new Address(this.wallet.address),
            grams: '1500000000',
            tokens: delta.toFixed(),
            withDerive: true,
        }).catch(err => {
            error('Cannot deposit token', err)
            if (side === PoolStoreDataProp.LEFT_TOKEN) {
                this.changeState(PoolStoreStateProp.IS_DEPOSITING_LEFT, false)
            }
            else if (side === PoolStoreDataProp.RIGHT_TOKEN) {
                this.changeState(PoolStoreStateProp.IS_DEPOSITING_RIGHT, false)
            }
        })
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
        this.changeState(PoolStoreStateProp.IS_DEPOSITING_LIQUIDITY, true)

        const owner = new Contract(DexAbi.Callbacks, new Address(this.wallet.address))

        let stream = this.transactionSubscriber?.transactions(
            new Address(this.wallet.address),
        )

        const oldStream = this.transactionSubscriber?.oldTransactions(new Address(this.wallet.address), {
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
                    && result.input.id.toString() === this.dex.nonce
                ) {
                    return E.left({ input: result.input })
                }

                if (
                    result.method === 'dexPairDepositLiquiditySuccess'
                    && result.input.id.toString() === this.dex.nonce
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
                new BigNumber(this.leftAmount || '0')
                    .shiftedBy(this.leftToken.decimals)
                    .decimalPlaces(0)
                    .toFixed(),
                new BigNumber(this.rightAmount || '0')
                    .shiftedBy(this.rightToken.decimals)
                    .decimalPlaces(0)
                    .toFixed(),
                this.isAutoExchangeEnable,
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
        catch (err) {
            error('Cannot deposit liquidity', err)
            this.changeState(PoolStoreStateProp.IS_DEPOSITING_LIQUIDITY, false)
        }
    }

    /**
     * Clean deposit liquidity transaction
     */
    public cleanDepositLiquidityResult(): void {
        this.depositLiquidityResult = undefined
    }

    /**
     * Withdraw token by the given root address and amount
     * @param {string} root
     * @param {string} amount
     */
    public async withdrawToken(root: string, amount: string): Promise<void> {
        if (root === this.leftToken?.root) {
            this.changeState(PoolStoreStateProp.IS_WITHDRAWING_LEFT, true)
        }
        else if (root === this.rightToken?.root) {
            this.changeState(PoolStoreStateProp.IS_WITHDRAWING_RIGHT, true)
        }
        else if (root === this.lpRoot) {
            this.changeState(PoolStoreStateProp.IS_WITHDRAWING_LP, true)
        }

        await this.dex.withdrawToken(root, amount).finally(() => {
            if (root === this.leftToken?.root) {
                this.changeState(PoolStoreStateProp.IS_WITHDRAWING_LEFT, false)
            }
            else if (root === this.rightToken?.root) {
                this.changeState(PoolStoreStateProp.IS_WITHDRAWING_RIGHT, false)
            }
            else if (root === this.lpRoot) {
                this.changeState(PoolStoreStateProp.IS_WITHDRAWING_LP, false)
            }
        })

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

        this.changeState(PoolStoreStateProp.IS_WITHDRAWING_LIQUIDITY, true)

        await Dex.withdrawLiquidity(
            new Address(this.wallet.address),
            new Address(this.leftToken?.root),
            new Address(this.rightToken?.root),
            new Address(this.lpRoot),
            this.lpWalletBalance,
        ).catch(() => {
            this.changeState(PoolStoreStateProp.IS_WITHDRAWING_LIQUIDITY, false)
        })

        await this.dex.syncBalances()
        await this.syncLpBalance()
        await this.syncPoolShare()

        this.changeState(PoolStoreStateProp.IS_WITHDRAWING_LIQUIDITY, false)
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
                await this.handleInitStep()
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
     * @param {TokenCache[]} tokens
     * @param {TokenCache[]} prevTokens
     * @returns {Promise<void>}
     * @protected
     */
    protected handleTokensChange(tokens: TokenCache[] = [], prevTokens: TokenCache[] = []): void {
        const [leftToken, rightToken] = tokens
        const [prevLeftToken, prevRightToken] = prevTokens

        const isLeftChanged = leftToken !== undefined && leftToken?.root !== prevLeftToken?.root
        const isRightChanged = rightToken !== undefined && rightToken?.root !== prevRightToken?.root

        if (leftToken?.root === rightToken?.root) {
            if (isLeftChanged) {
                const { leftAmount } = this
                // Note: do not use changeData method
                this.data[PoolStoreDataProp.RIGHT_TOKEN] = undefined
                this.data[PoolStoreDataProp.RIGHT_AMOUNT] = leftAmount
                this.data[PoolStoreDataProp.LEFT_AMOUNT] = ''
            }
            else if (isRightChanged) {
                const { rightAmount } = this
                // Note: do not use changeData method
                this.data[PoolStoreDataProp.LEFT_TOKEN] = undefined
                this.data[PoolStoreDataProp.LEFT_AMOUNT] = rightAmount
                this.data[PoolStoreDataProp.RIGHT_AMOUNT] = ''
            }
            this.changePoolData(PoolDataProp.PAIR, undefined)
        }

        if (leftToken?.root && rightToken?.root) {
            this.setStep(AddLiquidityStep.CHECK_PAIR)
        }
    }

    // /**
    //  *
    //  * @param {WalletData['transaction']} [transaction]
    //  * @protected
    //  */
    // protected handleTransactionResult(transaction?: WalletData['transaction']): void {
    //     if (
    //         !transaction
    //         || !this.wallet.address
    //         || !this.pairRoots
    //         || !this.leftToken
    //         || !this.rightToken
    //         || !this.pairBalances
    //         || !this.lpRoot
    //         || !this.lpWalletBalance
    //         || !this.lpDecimals
    //     ) {
    //         return
    //     }
    //
    //     const isInverted = this.pairRoots.left.toString() !== this.leftToken.root
    //     const leftDecimals = this.leftToken.decimals
    //     const rightDecimals = this.rightToken.decimals
    //     const leftSymbol = this.leftToken.symbol
    //     const rightSymbol = this.rightToken.symbol
    //     const {
    //         left: pairLeftBalance = '0',
    //         lp: pairLpBalance = '0',
    //         right: pairRightBalance = '0',
    //     } = this.pairBalances
    //     const {
    //         lpWalletBalance,
    //         lpDecimals,
    //         lpRoot,
    //         poolShare = '0.0',
    //         sharePercent = '0.0',
    //         shareChangePercent = '0.0',
    //         currentSharePercent = '0.0',
    //     } = this
    //
    //     const owner = new Contract(DexAbi.Callbacks, new Address(this.wallet.address))
    //     owner.decodeTransaction({
    //         transaction: toJS(transaction), // Convert Proxy to simple object
    //         methods: ['dexPairDepositLiquiditySuccess', 'dexPairOperationCancelled'],
    //     }).then(res => {
    //         if (
    //             res?.method === 'dexPairOperationCancelled'
    //             && res.input.id.toString() === this.dex.nonce
    //         ) {
    //             this.depositLiquidityResult = {
    //                 success: false,
    //                 errorData: {
    //                     [DepositLiquidityErrorDataProp.LEFT_SYMBOL]: leftSymbol,
    //                     [DepositLiquidityErrorDataProp.RIGHT_SYMBOL]: rightSymbol,
    //                 },
    //                 successData: undefined,
    //             }
    //             this.changeData(PoolStoreDataProp.LEFT_AMOUNT, '')
    //             this.changeData(PoolStoreDataProp.RIGHT_AMOUNT, '')
    //             this.changeState(PoolStoreStateProp.IS_DEPOSITING_LIQUIDITY, false)
    //         }
    //         else if (
    //             res?.method === 'dexPairDepositLiquiditySuccess'
    //             && res.input.id.toString() === this.dex.nonce
    //             && res.input.via_account
    //         ) {
    //             const result = res.input.result as PairExpectedDepositLiquidity
    //
    //             this.changePoolData(
    //                 PoolDataProp.SHARE,
    //                 new BigNumber(result.step_1_lp_reward.toString())
    //                     .plus(new BigNumber(result.step_3_lp_reward.toString()))
    //                     .toFixed(),
    //             )
    //             this.changePoolData(
    //                 PoolDataProp.SHARE_PERCENT,
    //                 this.isPoolEmpty
    //                     ? '100.0'
    //                     : new BigNumber(poolShare)
    //                         .plus(lpWalletBalance)
    //                         .multipliedBy(100)
    //                         .dividedBy(new BigNumber(pairLpBalance).plus(poolShare))
    //                         .decimalPlaces(8, BigNumber.ROUND_DOWN)
    //                         .toFixed(),
    //             )
    //             this.changePoolData(
    //                 PoolDataProp.CURRENT_SHARE_PERCENT,
    //                 this.isPoolEmpty
    //                     ? '0.0'
    //                     : new BigNumber(lpWalletBalance)
    //                         .multipliedBy(100)
    //                         .dividedBy(new BigNumber(pairLpBalance))
    //                         .decimalPlaces(8, BigNumber.ROUND_DOWN)
    //                         .toFixed(),
    //             )
    //             this.changePoolData(
    //                 PoolDataProp.SHARE_CHANGE_PERCENT,
    //                 this.isPoolEmpty
    //                     ? '100.0'
    //                     : new BigNumber(sharePercent)
    //                         .minus(currentSharePercent)
    //                         .decimalPlaces(8, BigNumber.ROUND_DOWN)
    //                         .toFixed(),
    //             )
    //
    //             let leftBN = new BigNumber(result.step_1_left_deposit).plus(result.step_3_left_deposit),
    //                 rightBN = new BigNumber(result.step_1_right_deposit).plus(result.step_3_right_deposit)
    //
    //             if (result.step_2_left_to_right) {
    //                 leftBN = leftBN.plus(result.step_2_spent)
    //                 rightBN = rightBN.minus(result.step_2_received)
    //             }
    //
    //             if (result.step_2_right_to_left) {
    //                 rightBN = rightBN.plus(result.step_2_spent)
    //                 leftBN = leftBN.minus(result.step_2_received)
    //             }
    //
    //             const leftDeposit = isInverted ? rightBN.toFixed() : leftBN.toFixed()
    //             const rightDeposit = isInverted ? leftBN.toFixed() : rightBN.toFixed()
    //
    //             const newLeftBN = new BigNumber(pairLeftBalance).plus(leftDeposit)
    //             const newRightBN = new BigNumber(pairRightBalance).plus(rightDeposit)
    //
    //             const newLeft = newLeftBN.toFixed()
    //             const newRight = newRightBN.toFixed()
    //
    //             const newLeftPrice = newLeftBN.shiftedBy(-leftDecimals)
    //                 .dividedBy(newRightBN.shiftedBy(-rightDecimals))
    //                 .decimalPlaces(leftDecimals, BigNumber.ROUND_UP)
    //                 .toFixed()
    //             const newRightPrice = newLeftBN.shiftedBy(-leftDecimals)
    //                 .dividedBy(newRightBN.shiftedBy(-rightDecimals))
    //                 .decimalPlaces(leftDecimals, BigNumber.ROUND_UP)
    //                 .toFixed()
    //
    //             this.changePoolData(PoolDataProp.NEW_LEFT_PRICE, newLeftPrice)
    //             this.changePoolData(PoolDataProp.NEW_RIGHT_PRICE, newRightPrice)
    //
    //             runInAction(() => {
    //                 this.depositLiquidityResult = {
    //                     success: true,
    //                     successData: {
    //                         [DepositLiquiditySuccessDataProp.LEFT_DECIMALS]: leftDecimals,
    //                         [DepositLiquiditySuccessDataProp.RIGHT_DECIMALS]: rightDecimals,
    //                         [DepositLiquiditySuccessDataProp.LEFT_DEPOSIT]: leftDeposit,
    //                         [DepositLiquiditySuccessDataProp.RIGHT_DEPOSIT]: rightDeposit,
    //                         [DepositLiquiditySuccessDataProp.HASH]: transaction.id.hash,
    //                         [DepositLiquiditySuccessDataProp.LEFT_SYMBOL]: leftSymbol,
    //                         [DepositLiquiditySuccessDataProp.RIGHT_SYMBOL]: rightSymbol,
    //                         [DepositLiquiditySuccessDataProp.LP_DECIMALS]: lpDecimals,
    //                         [DepositLiquiditySuccessDataProp.LP_ROOT]: lpRoot,
    //                         [DepositLiquiditySuccessDataProp.NEW_LEFT]: newLeft,
    //                         [DepositLiquiditySuccessDataProp.NEW_RIGHT]: newRight,
    //                         [DepositLiquiditySuccessDataProp.NEW_LEFT_PRICE]: newLeftPrice,
    //                         [DepositLiquiditySuccessDataProp.NEW_RIGHT_PRICE]: newRightPrice,
    //                         [DepositLiquiditySuccessDataProp.CURRENT_SHARE_PERCENT]: currentSharePercent,
    //                         [DepositLiquiditySuccessDataProp.SHARE]: poolShare,
    //                         [DepositLiquiditySuccessDataProp.SHARE_CHANGE_PERCENT]: shareChangePercent,
    //                         [DepositLiquiditySuccessDataProp.SHARE_PERCENT]: sharePercent,
    //                     },
    //                     errorData: undefined,
    //                 }
    //             })
    //
    //             this.reset()
    //             this.dex.balances?.clear()
    //             this.dex.wallets?.clear()
    //             this.setStep(AddLiquidityStep.SELECT_PAIR)
    //         }
    //     })
    // }

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
    protected handleLiquiditySuccess({ input, transaction }: DepositLiquiditySuccessResult): void {
        if (
            !transaction
            || !this.wallet.address
            || !this.pairRoots
            || !this.leftToken
            || !this.rightToken
            || !this.pairBalances
            || !this.lpRoot
            || !this.lpWalletBalance
            || !this.lpDecimals
        ) {
            return
        }

        const isInverted = this.pairRoots.left.toString() !== this.leftToken.root
        const leftDecimals = this.leftToken.decimals
        const rightDecimals = this.rightToken.decimals
        const leftSymbol = this.leftToken.symbol
        const rightSymbol = this.rightToken.symbol
        const {
            left: pairLeftBalance = '0',
            lp: pairLpBalance = '0',
            right: pairRightBalance = '0',
        } = this.pairBalances
        const {
            lpWalletBalance,
            lpDecimals,
            lpRoot,
            poolShare = '0.0',
            sharePercent = '0.0',
            shareChangePercent = '0.0',
            currentSharePercent = '0.0',
        } = this

        this.changePoolData(
            PoolDataProp.SHARE,
            new BigNumber(input.result.step_1_lp_reward.toString())
                .plus(new BigNumber(input.result.step_3_lp_reward.toString()))
                .toFixed(),
        )
        this.changePoolData(
            PoolDataProp.SHARE_PERCENT,
            this.isPoolEmpty
                ? '100.0'
                : new BigNumber(poolShare)
                    .plus(lpWalletBalance)
                    .multipliedBy(100)
                    .dividedBy(new BigNumber(pairLpBalance).plus(poolShare))
                    .decimalPlaces(8, BigNumber.ROUND_DOWN)
                    .toFixed(),
        )
        this.changePoolData(
            PoolDataProp.CURRENT_SHARE_PERCENT,
            this.isPoolEmpty
                ? '0.0'
                : new BigNumber(lpWalletBalance)
                    .multipliedBy(100)
                    .dividedBy(new BigNumber(pairLpBalance))
                    .decimalPlaces(8, BigNumber.ROUND_DOWN)
                    .toFixed(),
        )
        this.changePoolData(
            PoolDataProp.SHARE_CHANGE_PERCENT,
            this.isPoolEmpty
                ? '100.0'
                : new BigNumber(sharePercent)
                    .minus(currentSharePercent)
                    .decimalPlaces(8, BigNumber.ROUND_DOWN)
                    .toFixed(),
        )

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
        const newRightPrice = newLeftBN.shiftedBy(-leftDecimals)
            .dividedBy(newRightBN.shiftedBy(-rightDecimals))
            .decimalPlaces(leftDecimals, BigNumber.ROUND_UP)
            .toFixed()

        this.changePoolData(PoolDataProp.NEW_LEFT_PRICE, newLeftPrice)
        this.changePoolData(PoolDataProp.NEW_RIGHT_PRICE, newRightPrice)

        this.depositLiquidityResult = {
            success: true,
            successData: {
                [DepositLiquiditySuccessDataProp.LEFT_DECIMALS]: leftDecimals,
                [DepositLiquiditySuccessDataProp.RIGHT_DECIMALS]: rightDecimals,
                [DepositLiquiditySuccessDataProp.LEFT_DEPOSIT]: leftDeposit,
                [DepositLiquiditySuccessDataProp.RIGHT_DEPOSIT]: rightDeposit,
                [DepositLiquiditySuccessDataProp.HASH]: transaction.id.hash,
                [DepositLiquiditySuccessDataProp.LEFT_SYMBOL]: leftSymbol,
                [DepositLiquiditySuccessDataProp.RIGHT_SYMBOL]: rightSymbol,
                [DepositLiquiditySuccessDataProp.LP_DECIMALS]: lpDecimals,
                [DepositLiquiditySuccessDataProp.LP_ROOT]: lpRoot,
                [DepositLiquiditySuccessDataProp.NEW_LEFT]: newLeft,
                [DepositLiquiditySuccessDataProp.NEW_RIGHT]: newRight,
                [DepositLiquiditySuccessDataProp.NEW_LEFT_PRICE]: newLeftPrice,
                [DepositLiquiditySuccessDataProp.NEW_RIGHT_PRICE]: newRightPrice,
                [DepositLiquiditySuccessDataProp.CURRENT_SHARE_PERCENT]: currentSharePercent,
                [DepositLiquiditySuccessDataProp.SHARE]: poolShare,
                [DepositLiquiditySuccessDataProp.SHARE_CHANGE_PERCENT]: shareChangePercent,
                [DepositLiquiditySuccessDataProp.SHARE_PERCENT]: sharePercent,
            },
            errorData: undefined,
        }

        this.reset()
        this.dex.balances?.clear()
        this.dex.wallets?.clear()
        this.setStep(AddLiquidityStep.SELECT_PAIR)
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

        this.depositLiquidityResult = {
            success: false,
            errorData: {
                [DepositLiquidityErrorDataProp.LEFT_SYMBOL]: this.leftToken.symbol,
                [DepositLiquidityErrorDataProp.RIGHT_SYMBOL]: this.rightToken.symbol,
            },
            successData: undefined,
        }
        this.changeData(PoolStoreDataProp.LEFT_AMOUNT, '')
        this.changeData(PoolStoreDataProp.RIGHT_AMOUNT, '')
        this.changeState(PoolStoreStateProp.IS_DEPOSITING_LIQUIDITY, false)
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
    protected async handleInitStep(): Promise<void> {
        this.resetPoolData()
        this.setStep(AddLiquidityStep.CHECK_ACCOUNT)
    }

    /**
     *
     * @returns {Promise<void>}
     * @protected
     */
    protected async handleCheckDexAccountStep(): Promise<void> {
        await this.dex.connectAndSync()

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

            await this.dex.connect().then(() => {
                if (!this.dex.address) {
                    return
                }

                this.setStep(AddLiquidityStep.CHECK_PAIR)
            }).catch(() => {
                this.setStep(AddLiquidityStep.CONNECT_ACCOUNT)
            }).finally(() => {
                if (
                    !this.dex.address
                    && this.step === AddLiquidityStep.CONNECTING_ACCOUNT
                ) {
                    check()
                }
            })
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

        await checkPair(this.leftToken.root, this.rightToken.root).then(address => {
            this.changePoolData(PoolDataProp.PAIR, {
                [PoolPairProp.ADDRESS]: address?.toString(),
            })
        })

        if (!this.pairAddress) {
            this.setStep(AddLiquidityStep.CREATE_POOL)
            return
        }

        await Dex.pairLpRoot(new Address(this.pairAddress)).then(address => {
            this.changePoolData(PoolDataProp.LP_ROOT, address.toString())
        })

        if (!this.dex.address) {
            this.setStep(AddLiquidityStep.INIT)
            return
        }

        await this.dex.syncWallets()
        await this.dex.syncBalances()

        await this.syncLpBalance()
        await this.syncPairRoots()
        await this.syncPairBalances()

        if (this.isPoolEmpty === false) {
            const leftDecimals = this.leftToken.decimals
            const rightDecimals = this.rightToken.decimals

            const leftBN = new BigNumber(this.pairBalances?.left || '0').shiftedBy(-leftDecimals)
            const rightBN = new BigNumber(this.pairBalances?.right || '0').shiftedBy(-rightDecimals)

            this.changePoolData(
                PoolDataProp.LEFT_PRICE,
                leftBN.dividedBy(rightBN).decimalPlaces(leftDecimals, BigNumber.ROUND_UP).toFixed(),
            )
            this.changePoolData(
                PoolDataProp.RIGHT_PRICE,
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

            await checkPair(
                this.leftToken.root,
                this.rightToken.root,
            ).then(address => {
                if (!address) {
                    return
                }

                this.changePoolData(PoolDataProp.PAIR, {
                    ...this.pool[PoolDataProp.PAIR],
                    [PoolPairProp.ADDRESS]: address.toString(),
                })

                this.setStep(AddLiquidityStep.CHECK_PAIR)
            }).catch(() => {
                this.setStep(AddLiquidityStep.CHECK_PAIR)
            }).finally(() => {
                if (
                    !this.pairAddress
                    && this.step === AddLiquidityStep.CREATING_POOL
                ) {
                    check()
                }
            })
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

            await this.dex.syncWallets().catch(() => {
                this.setStep(AddLiquidityStep.CHECK_PAIR)
            }).finally(() => {
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
            })
        }, 5000)

        check()
    }

    /*
     * Internal utilities methods
     * ----------------------------------------------------------------------------------
     */

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
     * @param {K} key
     * @param {PoolStoreState[K]} value
     * @protected
     */
    protected changeState<K extends keyof PoolStoreState>(key: K, value: PoolStoreState[K]): void {
        this.state[key] = value
    }

    /**
     *
     * @param {AddLiquidityStep} [step]
     * @protected
     */
    protected setStep(step?: AddLiquidityStep): void {
        this.changeState(PoolStoreStateProp.STEP, step)
    }

    /**
     *
     * @param {K} key
     * @param {PoolStoreData[K]} value
     * @protected
     */
    protected changeAmount<K extends keyof PoolStoreData>(key: K, value: PoolStoreData[K]): void {
        this.data[key] = value

        if (this.isPoolEmpty) {
            this.syncPoolShare().catch(err => error(err))
            return
        }

        if (this.isAutoExchangeEnable) {
            this.syncPoolShare().catch(err => error(err))
            return
        }

        const getAmount = (price: string, amount: string, decimals: number) => (
            new BigNumber(price || '0').multipliedBy(amount).decimalPlaces(decimals, BigNumber.ROUND_UP)
        )

        if (
            key === PoolStoreDataProp.LEFT_AMOUNT
            && this.isLeftAmountValid
            && this.rightToken
        ) {
            const right = getAmount(this.rightPrice || '0', this.leftAmount, this.rightToken?.decimals)

            if (isAmountValid(right)) {
                this.data[PoolStoreDataProp.RIGHT_AMOUNT] = right.toFixed()
            }
            else {
                this.data[PoolStoreDataProp.RIGHT_AMOUNT] = ''
            }
        }
        else if (
            key === PoolStoreDataProp.RIGHT_AMOUNT
            && this.isRightAmountValid
            && this.leftToken
        ) {
            const left = getAmount(this.leftPrice || '0', this.rightAmount, this.leftToken.decimals)

            if (isAmountValid(left)) {
                this.data[PoolStoreDataProp.LEFT_AMOUNT] = left.toFixed()
            }
            else {
                this.data[PoolStoreDataProp.LEFT_AMOUNT] = ''
            }
        }
    }

    /**
     *
     * @protected
     */
    protected updateAmount(): void {
        if (this.isLeftAmountValid) {
            this.changeAmount(PoolStoreDataProp.LEFT_AMOUNT, this.leftAmount)
        }
        else if (this.isRightAmountValid) {
            this.changeAmount(PoolStoreDataProp.RIGHT_AMOUNT, this.rightAmount)
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

        this.changeState(PoolStoreStateProp.IS_SYNC_PAIR_BALANCES, true)

        await Dex.pairBalances(new Address(this.pairAddress)).then(balances => {
            this.changePoolData(PoolDataProp.PAIR, {
                ...this.pool[PoolDataProp.PAIR],
                [PoolPairProp.BALANCES]: balances,
            })
            this.changePoolData(PoolDataProp.IS_POOL_EMPTY, balances.lp === '0')
        }).finally(() => {
            this.changeState(PoolStoreStateProp.IS_SYNC_PAIR_BALANCES, false)
        })
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

        this.changeState(PoolStoreStateProp.IS_SYNC_PAIR_ROOTS, true)

        await Dex.pairTokenRoots(new Address(this.pairAddress)).then(roots => {
            this.changePoolData(PoolDataProp.PAIR, {
                ...this.pool[PoolDataProp.PAIR],
                [PoolPairProp.ROOTS]: roots,
            })

            if (this.pairRoots?.left.toString() !== this.leftToken?.root && this.pairBalances) {
                const { left, lp, right } = this.pairBalances
                this.changePoolData(PoolDataProp.PAIR, {
                    ...this.pool[PoolDataProp.PAIR],
                    [PoolPairProp.BALANCES]: {
                        lp,
                        left: right,
                        right: left,
                    },
                })
            }
        }).finally(() => {
            this.changeState(PoolStoreStateProp.IS_SYNC_PAIR_ROOTS, false)
        })
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
            await TokenWallet.decimal(new Address(this.lpRoot)).then(decimals => {
                this.changePoolData(
                    PoolDataProp.LP_DECIMALS,
                    !decimals ? undefined : parseInt(decimals, 10),
                )
            })
        }

        this.changePoolData(
            PoolDataProp.LP_BALANCE,
            this.dex.balances?.get(this.lpRoot as string) || '0',
        )

        if (!this.lpWalletAddress && this.wallet.address) {
            await TokenWallet.walletAddress({
                root: new Address(this.lpRoot),
                owner: new Address(this.wallet.address),
            }).then(address => {
                this.changePoolData(PoolDataProp.LP_WALLET_ADDRESS, address.toString())
            }).catch(err => {
                error('LP Wallet address error', err)
                this.changePoolData(PoolDataProp.LP_WALLET_ADDRESS, undefined)
            })
        }

        if (this.lpWalletAddress) {
            await TokenWallet.balance({
                wallet: new Address(this.lpWalletAddress),
            }).then(balance => {
                this.changePoolData(PoolDataProp.LP_WALLET_BALANCE, balance)
            }).catch(() => {
                this.changePoolData(PoolDataProp.LP_WALLET_BALANCE, undefined)
            })
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

        const leftAmount = new BigNumber(this.leftAmount || '0')
            .shiftedBy(this.leftToken.decimals)
            .decimalPlaces(0)
            .toFixed()

        const rightAmount = new BigNumber(this.rightAmount || '0')
            .shiftedBy(this.rightToken.decimals)
            .decimalPlaces(0)
            .toFixed()

        const isInverted = this.pairRoots.left.toString() !== this.leftToken.root
        const left = isInverted ? rightAmount : leftAmount
        const right = isInverted ? leftAmount : rightAmount

        await Dex.pairExpectedDepositLiquidity(
            new Address(this.pairAddress),
            this.isAutoExchangeEnable,
            left,
            right,
        ).then(result => {
            this.changePoolData(
                PoolDataProp.SHARE,
                new BigNumber(result.step_1_lp_reward.toString())
                    .plus(new BigNumber(result.step_3_lp_reward.toString()))
                    .toFixed(),
            )

            const pairLp = this.pairBalances?.lp
            const pairLeft = this.pairBalances?.left || '0'
            const pairRight = this.pairBalances?.right || '0'

            if (this.lpRoot && pairLp !== undefined) {
                if (this.isPoolEmpty) {
                    this.changePoolData(PoolDataProp.SHARE_PERCENT, '100.0')
                    this.changePoolData(PoolDataProp.CURRENT_SHARE_PERCENT, '0.0')
                    this.changePoolData(PoolDataProp.CURRENT_SHARE_LEFT, '0.0')
                    this.changePoolData(PoolDataProp.CURRENT_SHARE_RIGHT, '0.0')
                    this.changePoolData(PoolDataProp.SHARE_CHANGE_PERCENT, '100.0')
                }
                else {
                    this.changePoolData(
                        PoolDataProp.SHARE_PERCENT,
                        new BigNumber(this.poolShare || '0')
                            .plus(this.lpWalletBalance || '0')
                            .multipliedBy(100)
                            .dividedBy(new BigNumber(pairLp).plus(this.poolShare || '0'))
                            .decimalPlaces(8, BigNumber.ROUND_DOWN)
                            .toFixed(),
                    )
                    this.changePoolData(
                        PoolDataProp.CURRENT_SHARE_PERCENT,
                        new BigNumber(this.lpWalletBalance || '0')
                            .multipliedBy(100)
                            .dividedBy(new BigNumber(pairLp))
                            .decimalPlaces(8, BigNumber.ROUND_DOWN)
                            .toFixed(),
                    )
                    if (this.leftToken) {
                        this.changePoolData(
                            PoolDataProp.CURRENT_SHARE_LEFT,
                            new BigNumber(this.lpWalletBalance || '0')
                                .times(new BigNumber(pairLeft))
                                .dividedBy(new BigNumber(pairLp))
                                .decimalPlaces(0, BigNumber.ROUND_DOWN)
                                .shiftedBy(-this.leftToken.decimals)
                                .toString(),
                        )
                    }
                    if (this.rightToken) {
                        this.changePoolData(
                            PoolDataProp.CURRENT_SHARE_RIGHT,
                            new BigNumber(this.lpWalletBalance || '0')
                                .times(new BigNumber(pairRight))
                                .dividedBy(new BigNumber(pairLp))
                                .decimalPlaces(0, BigNumber.ROUND_DOWN)
                                .shiftedBy(-this.rightToken.decimals)
                                .toString(),
                        )
                    }
                    this.changePoolData(
                        PoolDataProp.SHARE_CHANGE_PERCENT,
                        new BigNumber(this.sharePercent || '0')
                            .minus(this.currentSharePercent || '0')
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

                this.changePoolData(
                    PoolDataProp.LEFT_DEPOSIT,
                    isInverted ? rightBN.toFixed() : leftBN.toFixed(),
                )
                this.changePoolData(
                    PoolDataProp.RIGHT_DEPOSIT,
                    isInverted ? leftBN.toFixed() : rightBN.toFixed(),
                )

                const newLeftBN = new BigNumber(pairLeft).plus(this.leftDeposit || '0')
                const newRightBN = new BigNumber(pairRight).plus(this.rightDeposit || '0')

                this.changePoolData(PoolDataProp.NEW_LEFT, newLeftBN.toFixed())
                this.changePoolData(PoolDataProp.NEW_RIGHT, newRightBN.toFixed())

                if (this.leftToken && this.rightToken) {
                    this.changePoolData(
                        PoolDataProp.NEW_LEFT_PRICE,
                        newLeftBN.shiftedBy(-this.leftToken.decimals)
                            .dividedBy(newRightBN.shiftedBy(-this.rightToken.decimals))
                            .decimalPlaces(this.leftToken.decimals, BigNumber.ROUND_UP)
                            .toFixed(),
                    )
                    this.changePoolData(
                        PoolDataProp.NEW_RIGHT_PRICE,
                        newRightBN.shiftedBy(-this.rightToken.decimals)
                            .dividedBy(newLeftBN.shiftedBy(-this.leftToken.decimals))
                            .decimalPlaces(this.rightToken.decimals, BigNumber.ROUND_UP)
                            .toFixed(),
                    )
                }
            }
            else {
                this.changePoolData(PoolDataProp.SHARE_PERCENT, undefined)
                this.changePoolData(PoolDataProp.SHARE_CHANGE_PERCENT, undefined)
                this.changePoolData(PoolDataProp.CURRENT_SHARE_PERCENT, undefined)
                this.changePoolData(PoolDataProp.NEW_LEFT, undefined)
                this.changePoolData(PoolDataProp.NEW_RIGHT, undefined)
                this.changePoolData(PoolDataProp.NEW_LEFT_PRICE, undefined)
                this.changePoolData(PoolDataProp.NEW_RIGHT_PRICE, undefined)
                this.changePoolData(PoolDataProp.LEFT_DEPOSIT, undefined)
                this.changePoolData(PoolDataProp.RIGHT_DEPOSIT, undefined)
            }
        })
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
        this.data = DEFAULT_POOL_STORE_DATA
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
        this.state = DEFAULT_POOL_STORE_STATE
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
        if (!this.isAutoExchangeEnable) {
            return this.isLeftAmountValid && this.isRightAmountValid
        }
        return this.isLeftAmountValid || this.isRightAmountValid
    }

    public get isSupplyReady(): boolean {
        return this.isAutoExchangeEnable
            ? (
                (
                    this.isLeftAmountValid
                    && this.rightAmount.length === 0
                    && this.isDexLeftBalanceValid
                )
                || (
                    this.isRightAmountValid
                    && this.leftAmount.length === 0
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

    public get dexLeftBalance(): string {
        return this.leftToken ? this.dex.balances?.get(this.leftToken?.root) || '0' : '0'
    }

    // public get isDepositLpAvailable(): boolean {
    //     return this.lpWalletBalance !== undefined && this.lpWalletBalance !== '0'
    // }

    public get isDexLeftBalanceValid(): boolean {
        if (!this.leftToken) {
            return false
        }

        const leftAmount = new BigNumber(this.leftAmount || '0').shiftedBy(this.leftToken.decimals)
        return leftAmount.lte(this.dexLeftBalance || '0')
    }

    public get isLeftTokenWithdrawAvailable(): boolean {
        return this.dexLeftBalance !== undefined && this.dexLeftBalance !== '0'
    }

    public get dexRightBalance(): string {
        return this.rightToken ? this.dex.balances?.get(this.rightToken?.root) || '0' : '0'
    }

    public get isDexRightBalanceValid(): boolean {
        if (!this.rightToken) {
            return false
        }

        const rightAmount = new BigNumber(this.rightAmount || '0').shiftedBy(this.rightToken.decimals)
        return rightAmount.lte(this.dexRightBalance || '0')
    }

    public get isRightTokenWithdrawAvailable(): boolean {
        return this.dexRightBalance !== undefined && this.dexRightBalance !== '0'
    }

    public get transaction(): DepositLiquidityResult | undefined {
        return this.depositLiquidityResult
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
        return isAmountValid(this.leftAmount, this.leftToken?.decimals)
    }

    public get isRightAmountValid(): boolean {
        return isAmountValid(this.rightAmount, this.rightToken?.decimals)
    }

    public get leftAmount(): PoolStoreData[PoolStoreDataProp.LEFT_AMOUNT] {
        return this.data[PoolStoreDataProp.LEFT_AMOUNT]
    }

    public get leftToken(): PoolStoreData[PoolStoreDataProp.LEFT_TOKEN] {
        return this.data[PoolStoreDataProp.LEFT_TOKEN]
    }

    public get rightAmount(): PoolStoreData[PoolStoreDataProp.RIGHT_AMOUNT] {
        return this.data[PoolStoreDataProp.RIGHT_AMOUNT]
    }

    public get rightToken(): PoolStoreData[PoolStoreDataProp.RIGHT_TOKEN] {
        return this.data[PoolStoreDataProp.RIGHT_TOKEN]
    }

    /*
     * Memoized store state values
     * ----------------------------------------------------------------------------------
     */

    public get isAutoExchangeEnable(): PoolStoreState[PoolStoreStateProp.IS_AUTO_EXCHANGE_ENABLE] {
        return this.state[PoolStoreStateProp.IS_AUTO_EXCHANGE_ENABLE]
    }

    public get isDepositingLeft(): PoolStoreState[PoolStoreStateProp.IS_DEPOSITING_LEFT] {
        return this.state[PoolStoreStateProp.IS_DEPOSITING_LEFT]
    }

    public get isDepositingLiquidity(): PoolStoreState[PoolStoreStateProp.IS_DEPOSITING_LIQUIDITY] {
        return this.state[PoolStoreStateProp.IS_DEPOSITING_LIQUIDITY]
    }

    // public get isDepositingLp(): PoolStoreState[PoolStoreStateProp.IS_DEPOSITING_LP] {
    //     return this.state[PoolStoreStateProp.IS_DEPOSITING_LP]
    // }

    public get isDepositingRight(): PoolStoreState[PoolStoreStateProp.IS_DEPOSITING_RIGHT] {
        return this.state[PoolStoreStateProp.IS_DEPOSITING_RIGHT]
    }

    public get isSyncPairBalances(): PoolStoreState[PoolStoreStateProp.IS_SYNC_PAIR_BALANCES] {
        return this.state[PoolStoreStateProp.IS_SYNC_PAIR_BALANCES]
    }

    public get isSyncPairRoots(): PoolStoreState[PoolStoreStateProp.IS_SYNC_PAIR_ROOTS] {
        return this.state[PoolStoreStateProp.IS_SYNC_PAIR_ROOTS]
    }

    public get isWithdrawingLeftToken(): PoolStoreState[PoolStoreStateProp.IS_WITHDRAWING_LEFT] {
        return this.state[PoolStoreStateProp.IS_WITHDRAWING_LEFT]
    }

    public get isWithdrawingLiquidity(): PoolStoreState[PoolStoreStateProp.IS_WITHDRAWING_LIQUIDITY] {
        return this.state[PoolStoreStateProp.IS_WITHDRAWING_LIQUIDITY]
    }

    public get isWithdrawingLp(): PoolStoreState[PoolStoreStateProp.IS_WITHDRAWING_LP] {
        return this.state[PoolStoreStateProp.IS_WITHDRAWING_LP]
    }

    public get isWithdrawingRightToken(): PoolStoreState[PoolStoreStateProp.IS_WITHDRAWING_RIGHT] {
        return this.state[PoolStoreStateProp.IS_WITHDRAWING_RIGHT]
    }

    public get step(): PoolStoreState[PoolStoreStateProp.STEP] {
        return this.state[PoolStoreStateProp.STEP]
    }

    /*
     * Memoized pool data values
     * ----------------------------------------------------------------------------------
     */

    public get isPoolEmpty(): PoolData[PoolDataProp.IS_POOL_EMPTY] {
        return this.pool[PoolDataProp.IS_POOL_EMPTY]
    }

    public get lpBalance(): PoolData[PoolDataProp.LP_BALANCE] {
        return this.pool[PoolDataProp.LP_BALANCE]
    }

    public get lpDecimals(): PoolData[PoolDataProp.LP_DECIMALS] {
        return this.pool[PoolDataProp.LP_DECIMALS]
    }

    public get lpRoot(): PoolData[PoolDataProp.LP_ROOT] {
        return this.pool[PoolDataProp.LP_ROOT]
    }

    public get lpWalletAddress(): PoolData[PoolDataProp.LP_WALLET_ADDRESS] {
        return this.pool[PoolDataProp.LP_WALLET_ADDRESS]
    }

    public get lpWalletBalance(): PoolData[PoolDataProp.LP_WALLET_BALANCE] {
        return this.pool[PoolDataProp.LP_WALLET_BALANCE]
    }

    public get poolShare(): PoolData[PoolDataProp.SHARE] {
        return this.pool[PoolDataProp.SHARE]
    }

    public get sharePercent(): PoolData[PoolDataProp.SHARE_PERCENT] {
        return this.pool[PoolDataProp.SHARE_PERCENT]
    }

    public get shareChangePercent(): PoolData[PoolDataProp.SHARE_CHANGE_PERCENT] {
        return this.pool[PoolDataProp.SHARE_CHANGE_PERCENT]
    }

    public get currentShareLeft(): PoolData[PoolDataProp.CURRENT_SHARE_LEFT] {
        return this.pool[PoolDataProp.CURRENT_SHARE_LEFT]
    }

    public get currentSharePercent(): PoolData[PoolDataProp.CURRENT_SHARE_PERCENT] {
        return this.pool[PoolDataProp.CURRENT_SHARE_PERCENT]
    }

    public get currentShareRight(): PoolData[PoolDataProp.CURRENT_SHARE_RIGHT] {
        return this.pool[PoolDataProp.CURRENT_SHARE_RIGHT]
    }

    public get leftPrice(): PoolData[PoolDataProp.LEFT_PRICE] {
        return this.pool[PoolDataProp.LEFT_PRICE]
    }

    public get rightPrice(): PoolData[PoolDataProp.RIGHT_PRICE] {
        return this.pool[PoolDataProp.RIGHT_PRICE]
    }

    public get newLeftPrice(): PoolData[PoolDataProp.NEW_LEFT_PRICE] {
        return this.pool[PoolDataProp.NEW_LEFT_PRICE]
    }

    public get newRightPrice(): PoolData[PoolDataProp.NEW_RIGHT_PRICE] {
        return this.pool[PoolDataProp.NEW_RIGHT_PRICE]
    }

    public get leftDeposit(): PoolData[PoolDataProp.LEFT_DEPOSIT] {
        return this.pool[PoolDataProp.LEFT_DEPOSIT]
    }

    public get rightDeposit(): PoolData[PoolDataProp.RIGHT_DEPOSIT] {
        return this.pool[PoolDataProp.RIGHT_DEPOSIT]
    }

    public get pair(): PoolData[PoolDataProp.PAIR] {
        return this.pool[PoolDataProp.PAIR]
    }

    public get pairAddress(): string | undefined {
        return this.pair ? this.pair[PoolPairProp.ADDRESS] : undefined
    }

    public get pairBalances(): PairBalances | undefined {
        return this.pair ? this.pair[PoolPairProp.BALANCES] : undefined
    }

    public get pairRoots(): PairTokenRoots | undefined {
        return this.pair ? this.pair[PoolPairProp.ROOTS] : undefined
    }

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


const Pool = new PoolStore(
    useWallet(),
    useDexAccount(),
)

export function usePool(): PoolStore {
    return Pool
}
