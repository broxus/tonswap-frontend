import BigNumber from 'bignumber.js'
import * as E from 'fp-ts/Either'
import {
    IReactionDisposer,
    action,
    makeAutoObservable,
    reaction,
    runInAction,
} from 'mobx'
import ton, { Address, Contract, Subscriber } from 'ton-inpage-provider'

import { DexAbi, checkPair, TokenWallet } from '@/misc'
import {
    DEFAULT_DECIMALS,
    DEFAULT_LEFT_TOKEN_ROOT,
    DEFAULT_RIGHT_TOKEN_ROOT,
    DEFAULT_SWAP_BILL,
    DEFAULT_SWAP_STORE_DATA,
    DEFAULT_SWAP_STORE_STATE,
} from '@/modules/Swap/constants'
import {
    SwapBill,
    SwapBillProp,
    SwapDirection,
    SwapFailureResult,
    SwapStoreData,
    SwapStoreDataProp,
    SwapStoreState,
    SwapStoreStateProp,
    SwapSuccessResult,
    SwapTransactionProp,
    SwapTransactionResult,
} from '@/modules/Swap/types'
import {
    getComputedDefaultPerPrice,
    getComputedNoRightAmountPerPrice,
    getComputedPriceImpact,
} from '@/modules/Swap/utils'
import { TokenCache, TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import { TokensListService, useTokensList } from '@/stores/TokensListService'
import { WalletService, useWallet } from '@/stores/WalletService'
import { debounce, error, isAmountValid } from '@/utils'


export class SwapStore {

    /**
     * Current data of the swap bill
     * @type {SwapBill}
     * @protected
     */
    protected bill: SwapBill = DEFAULT_SWAP_BILL

    /**
     * Current data of the swap form
     * @type {SwapStoreData}
     * @protected
     */
    protected data: SwapStoreData = DEFAULT_SWAP_STORE_DATA

    /**
     * Current state of the swap store
     * @type {SwapStoreState}
     * @protected
     */
    protected state: SwapStoreState = DEFAULT_SWAP_STORE_STATE

    /**
     * Last swap transaction result data
     * @type {SwapTransactionResult | undefined}
     * @protected
     */
    protected transactionResult: SwapTransactionResult | undefined = undefined

    /**
     * Internal swap transaction subscriber
     * @type {Subscriber}
     * @protected
     */
    protected transactionSubscriber: Subscriber | undefined

    /**
     * @param {WalletService} wallet
     * @param {TokensCacheService} tokensCache
     * @param {TokensListService} tokensList
     */
    constructor(
        protected readonly wallet: WalletService = useWallet(),
        protected readonly tokensCache: TokensCacheService = useTokensCache(),
        protected readonly tokensList: TokensListService = useTokensList(),
    ) {
        makeAutoObservable<
            SwapStore,
            | 'handleAmountsChange'
            | 'handleSlippageChange'
            | 'handleTokensChange'
            | 'handleWalletAccountChange'
        >(this, {
            changeData: action.bound,
            toggleTokensDirection: action.bound,
            handleAmountsChange: action.bound,
            handleSlippageChange: action.bound,
            handleTokensChange: action.bound,
            handleWalletAccountChange: action.bound,
        })

        reaction(() => this.tokensCache.tokens, () => {
            if (!this.leftToken || this.leftToken.root === DEFAULT_LEFT_TOKEN_ROOT) {
                this.changeData(SwapStoreDataProp.LEFT_TOKEN, this.tokensCache.get(DEFAULT_LEFT_TOKEN_ROOT))
            }

            if (!this.rightToken || this.rightToken.root === DEFAULT_RIGHT_TOKEN_ROOT) {
                this.changeData(SwapStoreDataProp.RIGHT_TOKEN, this.tokensCache.get(DEFAULT_RIGHT_TOKEN_ROOT))
            }
        })
    }

    /*
     * External actions for use it in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     * Manually change store data by the given key
     * @template K
     * @param {K} key
     * @param {SwapStoreData[K]} value
     */
    public changeData<K extends keyof SwapStoreData>(key: K, value: SwapStoreData[K]): void {
        if (key === SwapStoreDataProp.RIGHT_AMOUNT) {
            this.changeState(SwapStoreStateProp.DIRECTION, SwapDirection.RTL)
        }
        else if (key === SwapStoreDataProp.LEFT_AMOUNT) {
            this.changeState(SwapStoreStateProp.DIRECTION, SwapDirection.LTR)
        }

        if (
            [SwapStoreDataProp.LEFT_AMOUNT, SwapStoreDataProp.RIGHT_AMOUNT].includes(key)
            && (value as string).length === 0
        ) {
            this.data[SwapStoreDataProp.LEFT_AMOUNT] = ''
            this.data[SwapStoreDataProp.RIGHT_AMOUNT] = ''
            this.resetBill()
        }
        else {
            this.data[key] = value
        }
    }

    /**
     * Manually init all necessary subscribers.
     * Triggered initial tokens and change amounts.
     */
    public async init(): Promise<void> {
        if (this.transactionSubscriber !== undefined) {
            await this.transactionSubscriber.unsubscribe()
            this.transactionSubscriber = undefined
        }

        this.transactionSubscriber = new Subscriber(ton)

        this.#amountsDisposer = reaction(
            () => [this.leftAmount, this.rightAmount],
            debounce(this.handleAmountsChange, 400),
        )

        this.#slippageDisposer = reaction(() => this.slippage, this.handleSlippageChange)

        this.#tokensDisposer = reaction(
            () => [this.leftToken, this.rightToken],
            debounce(this.handleTokensChange, 100),
        )

        this.#walletAccountDisposer = reaction(() => this.wallet.address, this.handleWalletAccountChange)

        this.handleTokensChange([
            this.leftToken as TokenCache,
            this.rightToken as TokenCache,
        ]).then(async () => {
            await this.handleAmountsChange()
        })
    }

    /**
     * Manually dispose all of the internal subscribers.
     * Clean last transaction result, reset all data to their defaults.
     */
    public async dispose(): Promise<void> {
        if (this.transactionSubscriber !== undefined) {
            await this.transactionSubscriber.unsubscribe()
            this.transactionSubscriber = undefined
        }
        this.#amountsDisposer?.()
        this.#tokensDisposer?.()
        this.#walletAccountDisposer?.()
        this.cleanTransactionResult()
        this.reset()
    }

    /**
     * Manually start swap processing.
     * @returns {Promise<void>}
     */
    public async swap(): Promise<void> {
        if (
            !this.wallet.address
            || !this.isValid
            || (!this.pair?.address || !this.pairContract)
            || !this.leftToken?.root
            || !this.leftToken?.wallet
            || !this.amount
            || !this.minExpectedAmount
        ) {
            this.changeState(SwapStoreStateProp.IS_SWAPPING, false)
            return
        }

        const deployGrams = this.rightToken?.balance ? '0' : '100000000'

        const pairWallet = await TokenWallet.walletAddress({
            root: new Address(this.leftToken?.root),
            owner: this.pair.address,
        })

        const processingId = new BigNumber(
            Math.floor(
                Math.random() * (Number.MAX_SAFE_INTEGER - 1),
            ) + 1,
        ).toString()

        const {
            value0: payload,
        } = await this.pairContract?.methods.buildExchangePayload({
            id: processingId,
            expected_amount: this.minExpectedAmount,
            deploy_wallet_grams: deployGrams,
        }).call()

        this.changeState(SwapStoreStateProp.IS_LOADING, true)
        this.changeState(SwapStoreStateProp.IS_SWAPPING, true)

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
                methods: ['dexPairExchangeSuccess', 'dexPairOperationCancelled'],
            })

            if (result !== undefined) {
                if (result.method === 'dexPairOperationCancelled' && result.input.id.toString() === processingId) {
                    return E.left({ input: result.input })
                }

                if (result.method === 'dexPairExchangeSuccess' && result.input.id.toString() === processingId) {
                    return E.right({ input: result.input, transaction })
                }
            }

            return undefined
        }).first()

        try {
            await TokenWallet.send({
                address: new Address(this.leftToken?.wallet),
                grams: '2600000000',
                owner: new Address(this.wallet.address),
                payload,
                recipient: pairWallet,
                tokens: this.amount,
            })

            if (resultHandler !== undefined) {
                E.match(
                    (r: SwapFailureResult) => this.handleSwapFailure(r),
                    (r: SwapSuccessResult) => this.handleSwapSuccess(r),
                )(await resultHandler)
            }
        }
        catch (err) {
            error('decodeTransaction error: ', err)
            this.changeState(SwapStoreStateProp.IS_SWAPPING, false)
            this.changeState(SwapStoreStateProp.IS_LOADING, false)
        }
    }


    /**
     * Manually clean last transaction result
     */
    public cleanTransactionResult(): void {
        this.transactionResult = undefined
    }

    /**
     * Manually revert tokens direction
     */
    public toggleTokensDirection(): void {
        if (this.isLoading) {
            return
        }

        const {
            leftAmount,
            rightAmount,
            leftToken,
            rightToken,
        } = this

        this.data[SwapStoreDataProp.LEFT_AMOUNT] = rightAmount
        this.data[SwapStoreDataProp.RIGHT_AMOUNT] = leftAmount

        this.data[SwapStoreDataProp.LEFT_TOKEN] = rightToken
        this.data[SwapStoreDataProp.RIGHT_TOKEN] = leftToken

        if (this.direction === SwapDirection.LTR) {
            this.changeState(SwapStoreStateProp.DIRECTION, SwapDirection.RTL)
        }
        else if (this.direction === SwapDirection.RTL) {
            this.changeState(SwapStoreStateProp.DIRECTION, SwapDirection.LTR)
        }

        this.resetBill()
    }

    /**
     * Manually revert price direction
     */
    public togglePriceDirection(): void {
        this.changeState(
            SwapStoreStateProp.PRICE_DIRECTION,
            this.priceDirection === SwapDirection.LTR
                ? SwapDirection.RTL
                : SwapDirection.LTR,
        )
    }

    /*
     * Reactions handlers
     * ----------------------------------------------------------------------------------
     */

    /**
     * @param {(string | undefined)[]} amounts
     * @param {(string | undefined)[]} prevAmounts
     * @protected
     */
    protected async handleAmountsChange(amounts: string[] = [], prevAmounts: string[] = []): Promise<void> {
        const [leftAmount, rightAmount] = amounts
        const [prevLeftAmount, prevRightAmount] = prevAmounts

        if (
            this.isLoading
            || !this.wallet.address
            || (this.direction === SwapDirection.LTR && prevRightAmount !== rightAmount)
            || (this.direction === SwapDirection.RTL && prevLeftAmount !== leftAmount)
        ) {
            return
        }

        this.resetBill()

        if (this.pair?.address) {
            this.changeState(SwapStoreStateProp.IS_ENOUGH_LIQUIDITY, true)
            this.changeState(SwapStoreStateProp.IS_LOADING, true)

            await this.syncPairData()

            const leftBalance = this.pair.balances?.left || '0'
            const rightBalance = this.pair.balances?.right || '0'

            let leftBN = new BigNumber(leftBalance),
                rightBN = new BigNumber(rightBalance)

            if (!(this.pair?.roots?.left.toString() === this.leftToken?.root)) {
                const left = leftBN
                leftBN = rightBN
                rightBN = left
            }

            this.changeState(
                SwapStoreStateProp.IS_ENOUGH_LIQUIDITY,
                !leftBN.isZero() && !rightBN.isZero(),
            )

            const leftDecimals = this.leftToken?.decimals ?? DEFAULT_DECIMALS
            const rightDecimals = this.rightToken?.decimals ?? DEFAULT_DECIMALS

            if (this.isEnoughLiquidity && this.direction === SwapDirection.RTL) {
                if (this.isRightAmountValid) {
                    const amount = new BigNumber(this.rightAmount || '0').shiftedBy(rightDecimals)

                    this.changeState(SwapStoreStateProp.IS_ENOUGH_LIQUIDITY, amount.lt(rightBN))

                    if (!this.isEnoughLiquidity) {
                        runInAction(() => {
                            this.data.leftAmount = ''
                        })
                    }
                }
            }

            if (this.isEnoughLiquidity) {
                this.changeData(
                    SwapStoreDataProp.PRICE_LEFT_TO_RIGHT,
                    getComputedDefaultPerPrice(
                        leftBN,
                        leftDecimals,
                        rightBN.shiftedBy(-rightDecimals),
                        leftDecimals,
                    ),
                )
                this.changeData(
                    SwapStoreDataProp.PRICE_RIGHT_TO_LEFT,
                    getComputedDefaultPerPrice(
                        rightBN,
                        rightDecimals,
                        leftBN.shiftedBy(-leftDecimals),
                        rightDecimals,
                    ),
                )

                const leftDecimalsM = new BigNumber(10).pow(this.leftToken?.decimals || 0).toString()
                const rightDecimalsM = new BigNumber(10).pow(this.rightToken?.decimals || 0).toString()

                if (
                    (
                        this.direction === SwapDirection.RTL
                        || (this.leftAmount.length === 0 && this.direction !== SwapDirection.LTR)
                    )
                    && this.isRightAmountValid
                    && this.rightToken?.root
                ) {
                    runInAction(() => {
                        this.bill[SwapBillProp.EXPECTED_AMOUNT] = (
                            new BigNumber(this.rightAmount)
                                .times(rightDecimalsM)
                                .dp(0, BigNumber.ROUND_DOWN)
                                .toString()
                        )

                        this.bill[SwapBillProp.MIN_EXPECTED_AMOUNT] = (
                            new BigNumber(this.expectedAmount || '0')
                                .div(100)
                                .times(new BigNumber(100).minus(this.slippage))
                                .dp(0, BigNumber.ROUND_DOWN)
                                .toString()
                        )
                    })

                    if (this.pairContract) {
                        // TODO: replace this code with FIXME after upgrade DEX
                        // START
                        const {
                            numerator,
                            denominator,
                        } = await this.pairContract.methods.getFeeParams({
                            _answer_id: 0,
                        }).call()

                        const isSidesMatched = this.pair.roots?.left?.toString() === this.leftToken?.root
                        const aPool = isSidesMatched ? leftBalance : rightBalance
                        const bPool = isSidesMatched ? rightBalance : leftBalance

                        const newBPool = new BigNumber(bPool)
                            .minus(this.expectedAmount || '0')
                            .dp(0, BigNumber.ROUND_DOWN)
                            .toString()

                        const newAPool = new BigNumber(aPool)
                            .times(bPool)
                            .div(newBPool)
                            .dp(0, BigNumber.ROUND_DOWN)
                            .toString()

                        const expectedAmount = new BigNumber(newAPool)
                            .minus(aPool)
                            .times(denominator)
                            .div(new BigNumber(denominator).minus(numerator))
                            .dp(0, BigNumber.ROUND_DOWN)

                        const expectedFee = expectedAmount
                            .times(numerator)
                            .div(denominator)
                            .dp(0, BigNumber.ROUND_DOWN)
                        // END

                        // FIXME:
                        // const {
                        //     expected_amount: expectedAmount,
                        //     expected_fee: expectedFee,
                        // } = await this.pairContract?.methods.expectedSpendAmount({
                        //     _answer_id: 0,
                        //     receive_amount: this.expectedAmount,
                        //     receive_token_root: new Address(this.rightToken?.root),
                        // }).call()

                        if (expectedAmount.lte(0) || expectedAmount.isNaN() || !expectedAmount.isFinite()) {
                            runInAction(() => {
                                this.data[SwapStoreDataProp.LEFT_AMOUNT] = ''
                                this.data[SwapStoreDataProp.RIGHT_AMOUNT] = ''
                            })
                        }
                        else {
                            runInAction(() => {
                                this.bill[SwapBillProp.AMOUNT] = expectedAmount.toString()
                                this.bill[SwapBillProp.FEE] = expectedFee.toString()
                                this.data[SwapStoreDataProp.LEFT_AMOUNT] = expectedAmount.div(leftDecimalsM).toString()
                            })
                        }
                    }
                }
                else if (
                    this.direction !== SwapDirection.RTL
                    && this.isLeftAmountValid
                    && this.leftToken?.root
                ) {
                    runInAction(() => {
                        this.bill[SwapBillProp.AMOUNT] = new BigNumber(this.leftAmount || '0')
                            .times(leftDecimalsM)
                            .dp(0, BigNumber.ROUND_DOWN)
                            .toString()
                    })

                    if (this.pairContract) {
                        const {
                            expected_amount: expectedAmount,
                            expected_fee: expectedFee,
                        } = await this.pairContract.methods.expectedExchange({
                            _answer_id: 0,
                            amount: this.amount || '0',
                            spent_token_root: new Address(this.leftToken?.root),
                        }).call()

                        runInAction(() => {
                            this.bill[SwapBillProp.FEE] = expectedFee.toString()
                            this.bill[SwapBillProp.EXPECTED_AMOUNT] = expectedAmount.toString()
                            this.bill[SwapBillProp.MIN_EXPECTED_AMOUNT] = (
                                new BigNumber(this.expectedAmount || '0')
                                    .div(100)
                                    .times(new BigNumber(100).minus(this.slippage))
                                    .dp(0, BigNumber.ROUND_DOWN)
                                    .toString()
                            )
                        })

                        const newRight = new BigNumber(this.expectedAmount || '0').div(rightDecimalsM)

                        if (
                            newRight.isFinite()
                            && newRight.isPositive()
                            && !newRight.isZero()
                            && !newRight.isNaN()
                        ) {
                            runInAction(() => {
                                this.data[SwapStoreDataProp.RIGHT_AMOUNT] = newRight.toFixed()
                            })
                        }
                        else {
                            runInAction(() => {
                                this.data[SwapStoreDataProp.RIGHT_AMOUNT] = ''
                            })
                        }
                    }
                }

                if (this.isRightAmountValid) {
                    if (this.amount && this.expectedAmount) {
                        const priceLeftToRight = getComputedNoRightAmountPerPrice(
                            this.amount,
                            this.expectedAmount,
                            rightDecimals,
                        )

                        if (
                            priceLeftToRight.isFinite()
                            && !priceLeftToRight.isNaN()
                            && priceLeftToRight.gt(0)
                        ) {
                            this.changeData(
                                SwapStoreDataProp.PRICE_LEFT_TO_RIGHT,
                                priceLeftToRight.toString(),
                            )
                        }

                        const priceRightToLeft = getComputedNoRightAmountPerPrice(
                            this.expectedAmount,
                            this.amount,
                            leftDecimals,
                        )

                        if (
                            priceRightToLeft.isFinite()
                            && !priceRightToLeft.isNaN()
                            && priceRightToLeft.gt(0)
                        ) {
                            this.changeData(
                                SwapStoreDataProp.PRICE_RIGHT_TO_LEFT,
                                priceRightToLeft.toString(),
                            )
                        }

                        if (this.pair.roots?.left?.toString() === this.leftToken?.root) {
                            runInAction(() => {
                                this.bill[SwapBillProp.PRICE_IMPACT] = getComputedPriceImpact(
                                    new BigNumber(leftBalance).div(rightBalance),
                                    new BigNumber(leftBalance)
                                        .plus(this.amount || '0')
                                        .div(new BigNumber(rightBalance).minus(this.expectedAmount || '0')),
                                )
                            })
                        }
                        else {
                            runInAction(() => {
                                this.bill[SwapBillProp.PRICE_IMPACT] = getComputedPriceImpact(
                                    new BigNumber(rightBalance).div(leftBalance),
                                    new BigNumber(rightBalance)
                                        .plus(this.amount || '0')
                                        .div(new BigNumber(leftBalance).minus(this.expectedAmount || '0')),
                                )
                            })
                        }
                    }
                }
            }
            else {
                this.changeData(SwapStoreDataProp.PRICE_LEFT_TO_RIGHT, undefined)
                this.changeData(SwapStoreDataProp.PRICE_RIGHT_TO_LEFT, undefined)
            }
        }
        else {
            this.changeData(SwapStoreDataProp.PRICE_LEFT_TO_RIGHT, undefined)
            this.changeData(SwapStoreDataProp.PRICE_RIGHT_TO_LEFT, undefined)
        }

        this.changeData(SwapStoreDataProp.PRICE_DECIMALS_LEFT, this.leftToken?.decimals)
        this.changeData(SwapStoreDataProp.PRICE_DECIMALS_RIGHT, this.rightToken?.decimals)
        this.changeState(
            SwapStoreStateProp.IS_VALID,
            (
                this.isEnoughLiquidity
                && this.pair?.address !== undefined
                && this.amount !== undefined
                && this.leftToken?.wallet !== undefined
                && new BigNumber(this.expectedAmount || 0).gt(0)
                && new BigNumber(this.amount || 0).gt(0)
                && new BigNumber(this.leftToken?.balance || 0).gte(this.amount)
            ),
        )
        this.changeState(SwapStoreStateProp.IS_LOADING, false)
    }

    /**
     *
     * @param {string} value
     * @param {string} prevValue
     * @protected
     */
    protected handleSlippageChange(value: string, prevValue: string): void {
        if (value === prevValue) {
            return
        }

        const val = new BigNumber(value || '0')

        if (val.isNaN() || !val.isFinite() || val.lte(0)) {
            this.changeData(SwapStoreDataProp.SLIPPAGE, '0.5')
        }
        else {
            this.changeData(SwapStoreDataProp.SLIPPAGE, val.toString())
        }

        if (this.expectedAmount) {
            this.bill[SwapBillProp.MIN_EXPECTED_AMOUNT] = new BigNumber(this.expectedAmount)
                .div(100)
                .times(new BigNumber(100).minus(this.slippage))
                .dp(0, BigNumber.ROUND_DOWN)
                .toString()
        }
    }

    /**
     *
     * @param {TokenCache[]} [tokens]
     * @param {TokenCache[]} [prevTokens]
     * @returns {Promise<void>}
     * @protected
     */
    protected async handleTokensChange(tokens: TokenCache[] = [], prevTokens: TokenCache[] = []): Promise<void> {
        if (this.isLoading || !this.wallet.address) {
            return
        }

        this.resetBill()

        const [leftToken, rightToken] = tokens
        const [prevLeftToken, prevRightToken] = prevTokens

        const isLeftChanged = leftToken && leftToken?.root !== prevLeftToken?.root
        const isRightChanged = rightToken && rightToken?.root !== prevRightToken?.root
        const isToggleDirection = (
            leftToken?.root === prevRightToken?.root
            && rightToken?.root === prevLeftToken?.root
        )

        if (leftToken?.root === rightToken?.root) {
            if (isLeftChanged) {
                const { leftAmount } = this
                this.data[SwapStoreDataProp.RIGHT_TOKEN] = undefined
                this.data[SwapStoreDataProp.RIGHT_AMOUNT] = leftAmount
                this.data[SwapStoreDataProp.LEFT_AMOUNT] = ''
            }
            else if (isRightChanged) {
                const { rightAmount } = this
                this.data[SwapStoreDataProp.LEFT_TOKEN] = undefined
                this.data[SwapStoreDataProp.LEFT_AMOUNT] = rightAmount
                this.data[SwapStoreDataProp.RIGHT_AMOUNT] = ''
            }
        }

        if ((isLeftChanged || isRightChanged) && !isToggleDirection) {
            this.changeData(SwapStoreDataProp.PAIR, undefined)
            this.changeState(SwapStoreStateProp.PAIR_EXIST, false)
        }

        if (!leftToken?.root || !rightToken?.root) {
            this.changeData(SwapStoreDataProp.PAIR, undefined)
            this.changeState(SwapStoreStateProp.PAIR_EXIST, false)
            return
        }

        if (!this.pair) {
            this.changeState(SwapStoreStateProp.IS_LOADING, true)

            await checkPair(
                leftToken?.root,
                rightToken?.root,
            ).then(pair => {
                this.changeData(SwapStoreDataProp.PAIR, { address: pair })
                this.changeState(SwapStoreStateProp.PAIR_EXIST, !!pair)
                this.changeState(SwapStoreStateProp.IS_LOADING, false)
            }).catch(() => {
                this.changeData(SwapStoreDataProp.PAIR, undefined)
                this.changeState(SwapStoreStateProp.PAIR_EXIST, false)
                this.changeState(SwapStoreStateProp.IS_LOADING, false)
            })
        }

        await this.handleAmountsChange()
    }

    /**
     *
     * @param {string} [walletAddress]
     * @param {string} [prevWalletAddress]
     * @protected
     */
    protected handleWalletAccountChange(walletAddress?: string, prevWalletAddress?: string): void {
        if (walletAddress !== prevWalletAddress) {
            this.reset()
        }
    }

    /*
     * Internal swap processing handlers
     * ----------------------------------------------------------------------------------
     */

    /**
     * Success transaction callback handler
     * @param {SwapSuccessResult['input']} input
     * @param {SwapSuccessResult['transaction']} transaction
     * @protected
     */
    protected handleSwapSuccess({ input, transaction }: SwapSuccessResult): void {
        this.transactionResult = {
            [SwapTransactionProp.HASH]: transaction.id.hash,

            [SwapTransactionProp.RECEIVED_AMOUNT]: input.result.received.toString(),
            [SwapTransactionProp.RECEIVED_DECIMALS]: this.rightToken?.decimals,
            [SwapTransactionProp.RECEIVED_ICON]: this.rightToken?.icon,
            [SwapTransactionProp.RECEIVED_ROOT]: this.rightToken?.root,
            [SwapTransactionProp.RECEIVED_SYMBOL]: this.rightToken?.symbol,

            [SwapTransactionProp.SPENT_AMOUNT]: input.result.spent.toString(),
            [SwapTransactionProp.SPENT_DECIMALS]: this.leftToken?.decimals,
            [SwapTransactionProp.SPENT_FEE]: input.result.fee.toString(),
            [SwapTransactionProp.SPENT_SYMBOL]: this.leftToken?.symbol,

            [SwapTransactionProp.SUCCESS]: true,
        }

        this.changeState(SwapStoreStateProp.IS_SWAPPING, false)
        this.changeState(SwapStoreStateProp.IS_LOADING, false)
        this.changeState(SwapStoreStateProp.IS_VALID, false)

        this.data[SwapStoreDataProp.LEFT_AMOUNT] = ''
        this.data[SwapStoreDataProp.RIGHT_AMOUNT] = ''
    }

    /**
     * Failure transaction callback handler
     * @param _
     * @protected
     */
    protected handleSwapFailure(_?: SwapFailureResult): void {
        this.transactionResult = {
            [SwapTransactionProp.SUCCESS]: false,
        }

        this.changeState(SwapStoreStateProp.IS_SWAPPING, false)
        this.changeState(SwapStoreStateProp.IS_LOADING, false)
    }

    /*
     * Internal utilities methods
     * ----------------------------------------------------------------------------------
     */

    /**
     * Manually change store state by the given key
     * @template K
     * @param {K} key
     * @param {SwapStoreState[K]} value
     */
    protected changeState<K extends keyof SwapStoreState>(key: K, value: SwapStoreState[K]): void {
        this.state[key] = value
    }

    /**
     * Reset swap `bill` and `state` to default values.
     * @protected
     */
    protected reset(): void {
        this.resetBill()
        this.resetState()
    }

    /**
     * Reset swap `bill` data to default values
     * @protected
     */
    protected resetBill(): void {
        this.bill = DEFAULT_SWAP_BILL
    }

    /**
     * Reset swap `state` data to default values
     * @protected
     */
    protected resetState(): void {
        this.data = {
            ...DEFAULT_SWAP_STORE_DATA,
            [SwapStoreDataProp.LEFT_TOKEN]: this.leftToken,
            [SwapStoreDataProp.RIGHT_TOKEN]: this.rightToken,
        }
    }

    /**
     * Sync pool from network
     * @returns {Promise<void>}
     * @protected
     */
    protected async syncPairData(): Promise<void> {
        if (!this.pairContract) {
            return
        }

        await Promise.all([
            this.pairContract.methods.left_balance({}).call(),
            this.pairContract.methods.right_balance({}).call(),
            this.pairContract.methods.getTokenRoots({
                _answer_id: 0,
            }).call(),
        ]).then(async ([
            { left_balance: leftBalance },
            { right_balance: rightBalance },
            { left: leftRoot, right: rightRoot },
        ]) => {
            this.changeData(SwapStoreDataProp.PAIR, {
                address: this.pair?.address,
                balances: {
                    left: leftBalance.toString(),
                    right: rightBalance.toString(),
                },
                roots: {
                    left: leftRoot,
                    right: rightRoot,
                },
            })
        })
    }

    /*
     * Memoized bill values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @returns {SwapBill[SwapBillProp.AMOUNT]}
     */
    public get amount(): SwapBill[SwapBillProp.AMOUNT] {
        return this.bill[SwapBillProp.AMOUNT]
    }

    /**
     *
     * @returns {SwapBill[SwapBillProp.EXPECTED_AMOUNT]}
     */
    public get expectedAmount(): SwapBill[SwapBillProp.EXPECTED_AMOUNT] {
        return this.bill[SwapBillProp.EXPECTED_AMOUNT]
    }

    /**
     *
     * @returns {SwapBill[SwapBillProp.FEE]}
     */
    public get fee(): SwapBill[SwapBillProp.FEE] {
        return this.bill[SwapBillProp.FEE]
    }

    /**
     *
     * @returns {SwapBill[SwapBillProp.MIN_EXPECTED_AMOUNT]}
     */
    public get minExpectedAmount(): SwapBill[SwapBillProp.MIN_EXPECTED_AMOUNT] {
        return this.bill[SwapBillProp.MIN_EXPECTED_AMOUNT]
    }

    /**
     *
     * @returns {SwapBill[SwapBillProp.PRICE_IMPACT]}
     */
    public get priceImpact(): SwapBill[SwapBillProp.PRICE_IMPACT] {
        return this.bill[SwapBillProp.PRICE_IMPACT]
    }

    /*
     * Memoized store data values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get isLeftAmountValid(): boolean {
        return isAmountValid(this.leftAmount, this.leftToken?.decimals)
    }

    /**
     *
     */
    public get isRightAmountValid(): boolean {
        return isAmountValid(this.rightAmount, this.rightToken?.decimals)
    }

    /**
     *
     * @returns {SwapStoreData[SwapStoreDataProp.LEFT_AMOUNT]}
     */
    public get leftAmount(): SwapStoreData[SwapStoreDataProp.LEFT_AMOUNT] {
        return this.data[SwapStoreDataProp.LEFT_AMOUNT]
    }

    /**
     *
     * @returns {SwapStoreData[SwapStoreDataProp.LEFT_TOKEN]}
     */
    public get leftToken(): SwapStoreData[SwapStoreDataProp.LEFT_TOKEN] {
        return this.data[SwapStoreDataProp.LEFT_TOKEN]
    }

    /**
     *
     * @returns {SwapStoreData[SwapStoreDataProp.PAIR]}
     */
    public get pair(): SwapStoreData[SwapStoreDataProp.PAIR] {
        return this.data[SwapStoreDataProp.PAIR]
    }

    /**
     *
     * @returns {Contract<typeof DexAbi.Pair> | undefined}
     * @protected
     */
    protected get pairContract(): Contract<typeof DexAbi.Pair> | undefined {
        return this.pair?.address ? new Contract(DexAbi.Pair, this.pair.address) : undefined
    }

    /**
     *
     * @returns {SwapStoreData[SwapStoreDataProp.PRICE_DECIMALS_LEFT]}
     */
    public get priceDecimalsLeft(): SwapStoreData[SwapStoreDataProp.PRICE_DECIMALS_LEFT] {
        return this.data[SwapStoreDataProp.PRICE_DECIMALS_LEFT]
    }

    /**
     *
     * @returns {SwapStoreData[SwapStoreDataProp.PRICE_DECIMALS_RIGHT]}
     */
    public get priceDecimalsRight(): SwapStoreData[SwapStoreDataProp.PRICE_DECIMALS_RIGHT] {
        return this.data[SwapStoreDataProp.PRICE_DECIMALS_RIGHT]
    }

    /**
     *
     * @returns {SwapStoreData[SwapStoreDataProp.PRICE_LEFT_TO_RIGHT]}
     */
    public get priceLeftToRight(): SwapStoreData[SwapStoreDataProp.PRICE_LEFT_TO_RIGHT] {
        return this.data[SwapStoreDataProp.PRICE_LEFT_TO_RIGHT]
    }

    /**
     *
     * @returns {SwapStoreData[SwapStoreDataProp.PRICE_RIGHT_TO_LEFT]}
     */
    public get priceRightToLeft(): SwapStoreData[SwapStoreDataProp.PRICE_RIGHT_TO_LEFT] {
        return this.data[SwapStoreDataProp.PRICE_RIGHT_TO_LEFT]
    }

    /**
     *
     * @returns {SwapStoreData[SwapStoreDataProp.RIGHT_AMOUNT]}
     */
    public get rightAmount(): SwapStoreData[SwapStoreDataProp.RIGHT_AMOUNT] {
        return this.data[SwapStoreDataProp.RIGHT_AMOUNT]
    }

    /**
     *
     * @returns {SwapStoreData[SwapStoreDataProp.RIGHT_TOKEN]}
     */
    public get rightToken(): SwapStoreData[SwapStoreDataProp.RIGHT_TOKEN] {
        return this.data[SwapStoreDataProp.RIGHT_TOKEN]
    }

    /**
     *
     * @returns {SwapStoreData[SwapStoreDataProp.SLIPPAGE]}
     */
    public get slippage(): SwapStoreData[SwapStoreDataProp.SLIPPAGE] {
        return this.data[SwapStoreDataProp.SLIPPAGE]
    }

    /**
     *
     * @returns {SwapStoreState[SwapStoreStateProp.DIRECTION]}
     */
    public get direction(): SwapStoreState[SwapStoreStateProp.DIRECTION] {
        return this.state[SwapStoreStateProp.DIRECTION]
    }

    /**
     *
     * @returns {SwapStoreState[SwapStoreStateProp.IS_ENOUGH_LIQUIDITY]}
     */
    public get isEnoughLiquidity(): SwapStoreState[SwapStoreStateProp.IS_ENOUGH_LIQUIDITY] {
        return this.state[SwapStoreStateProp.IS_ENOUGH_LIQUIDITY]
    }

    /*
     * Memoized store state values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @returns {SwapStoreState[SwapStoreStateProp.IS_LOADING]}
     */
    public get isLoading(): SwapStoreState[SwapStoreStateProp.IS_LOADING] {
        return this.state[SwapStoreStateProp.IS_LOADING]
    }

    /**
     *
     * @returns {SwapStoreState[SwapStoreStateProp.IS_SWAPPING]}
     */
    public get isSwapping(): SwapStoreState[SwapStoreStateProp.IS_SWAPPING] {
        return this.state[SwapStoreStateProp.IS_SWAPPING]
    }

    /**
     *
     * @returns {SwapStoreState[SwapStoreStateProp.IS_VALID]}
     */
    public get isValid(): SwapStoreState[SwapStoreStateProp.IS_VALID] {
        return this.state[SwapStoreStateProp.IS_VALID]
    }

    /**
     *
     * @returns {SwapStoreState[SwapStoreStateProp.PAIR_EXIST]}
     */
    public get pairExist(): SwapStoreState[SwapStoreStateProp.PAIR_EXIST] {
        return this.state[SwapStoreStateProp.PAIR_EXIST]
    }

    /**
     *
     * @returns {SwapStoreState[SwapStoreStateProp.PRICE_DIRECTION]}
     */
    public get priceDirection(): SwapStoreState[SwapStoreStateProp.PRICE_DIRECTION] {
        return this.state[SwapStoreStateProp.PRICE_DIRECTION]
    }

    /**
     *
     * @returns {SwapTransactionResult | undefined}
     */
    public get transaction(): SwapTransactionResult | undefined {
        return this.transactionResult
    }

    /*
     * Internal reaction disposers
     * ----------------------------------------------------------------------------------
     */

    #amountsDisposer: IReactionDisposer | undefined

    #slippageDisposer: IReactionDisposer | undefined

    #tokensDisposer: IReactionDisposer | undefined

    #walletAccountDisposer: IReactionDisposer | undefined

}


const Swap = new SwapStore()

export function useSwap(): SwapStore {
    return Swap
}
