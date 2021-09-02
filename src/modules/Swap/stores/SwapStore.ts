import BigNumber from 'bignumber.js'
import * as E from 'fp-ts/Either'
import {
    action, IReactionDisposer, makeAutoObservable, reaction, toJS,
} from 'mobx'
import ton, {
    Address, Contract, DecodedAbiFunctionInputs, Subscriber,
} from 'ton-inpage-provider'

import { API_URL, CROSS_PAIR_EXCHANGE_WHITE_LIST } from '@/constants'
import { checkPair, DexAbi, TokenWallet } from '@/misc'
import { CrossPairsRequest, PairsResponse } from '@/modules/Pairs/types'
import {
    DEFAULT_DECIMALS,
    DEFAULT_SWAP_BILL,
    DEFAULT_SWAP_STORE_DATA,
    DEFAULT_SWAP_STORE_STATE,
} from '@/modules/Swap/constants'
import {
    SwapBill,
    SwapDirection,
    SwapExchangeMode,
    SwapFailureResult,
    SwapPair,
    SwapRoute,
    SwapRouteResult,
    SwapStoreData,
    SwapStoreState,
    SwapSuccessResult,
    SwapTransactionReceipt,
} from '@/modules/Swap/types'
import {
    fillStepResult,
    getCrossExchangePriceImpact,
    getCrossExchangeSlippage,
    getDefaultPerPrice, getDirectExchangePriceImpact,
    getExchangePerPrice,
    getExpectedExchange,
    getExpectedSpendAmount,
    getReducedCrossExchangeAmount,
    getReducedCrossExchangeFee,
    getSlippageMinExpectedAmount,
    intersection,
} from '@/modules/Swap/utils'
import { TokenCache, TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import { useWallet, WalletService } from '@/stores/WalletService'
import {
    debounce, debug, error, isAmountValid,
} from '@/utils'


export class SwapStore {

    /**
     * Current data of the direct swap bill.
     * @type {SwapBill}
     * @protected
     */
    protected bill: SwapBill = DEFAULT_SWAP_BILL

    /**
     * Current data of the swap form.
     * @type {SwapStoreData}
     * @protected
     */
    protected data: SwapStoreData = DEFAULT_SWAP_STORE_DATA

    /**
     * Current state of the swap store and form.
     * @type {SwapStoreState}
     * @protected
     */
    protected state: SwapStoreState = DEFAULT_SWAP_STORE_STATE

    /**
     * Last swap transaction result data.
     * @type {SwapTransactionReceipt | undefined}
     * @protected
     */
    protected transactionReceipt: SwapTransactionReceipt | undefined = undefined

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
    ) {
        makeAutoObservable<
            SwapStore,
            | 'handleSlippageChange'
            | 'handleTokensChange'
            | 'handleWalletAccountChange'
        >(this, {
            changeData: action.bound,
            cleanTransactionResult: action.bound,
            toggleDirection: action.bound,
            toggleSwapExchangeMode: action.bound,
            handleSlippageChange: action.bound,
            handleTokensChange: action.bound,
            handleWalletAccountChange: action.bound,
        })
    }


    /*
     * Public actions. Useful in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     * Change store data by the given key and value.
     * @param {K extends keyof SwapStoreData} key
     * @param {SwapStoreData[K]} value
     */
    public changeData<K extends keyof SwapStoreData>(key: K, value: SwapStoreData[K]): void {
        this.data[key] = value
    }

    /**
     * Change store state by the given key and value.
     * @param {K extends keyof SwapStoreState} key
     * @param {SwapStoreState[K]} value
     */
    public changeState<K extends keyof SwapStoreState>(key: K, value: SwapStoreState[K]): void {
        this.state[key] = value
    }

    /**
     * Manually initiate store.
     * Run all necessary subscribers.
     */
    public async init(): Promise<void> {
        this.#walletAccountDisposer = reaction(
            () => this.wallet.address,
            this.handleWalletAccountChange,
        )

        if (this.wallet.account === undefined) {
            return
        }

        await this.unsubscribeTransactionSubscriber()

        this.#transactionSubscriber = new Subscriber(ton)

        this.#slippageDisposer = reaction(
            () => this.data.slippage,
            this.handleSlippageChange,
        )

        this.#tokensDisposer = reaction(
            () => [this.data.leftToken, this.data.rightToken],
            debounce(this.handleTokensChange, 100),
        )

        try {
            await this.handleTokensChange([
                this.data.leftToken,
                this.data.rightToken,
            ])
            this.finalizeDirectCalculation()
            await this.recalculate()
        }
        catch (e) {}
    }

    /**
     * Manually dispose all of the internal subscribers.
     * Clean last transaction result, intervals
     * and reset all data to their defaults.
     */
    public async dispose(): Promise<void> {
        await this.unsubscribeTransactionSubscriber()
        this.#tokensDisposer?.()
        this.#walletAccountDisposer?.()
        this.cleanTransactionResult()
        this.cleanPairUpdatesInterval()
        this.reset()
    }

    /**
     * Manually start direct swap process.
     * @returns {Promise<void>}
     */
    public async swap(): Promise<void> {
        if (
            this.wallet.account?.address === undefined
            || !this.isDirectSwapValid
            || (this.pair?.address === undefined || this.pair.contract === undefined)
            || this.leftTokenAddress === undefined
            || this.leftToken?.wallet === undefined
            || this.bill.amount === undefined
            || this.bill.minExpectedAmount === undefined
        ) {
            this.changeState('isSwapping', false)
            return
        }

        const deployGrams = this.rightToken?.balance === undefined ? '100000000' : '0'

        const pairWallet = await TokenWallet.walletAddress({
            root: this.leftTokenAddress,
            owner: this.pair.address,
        })

        const processingId = new BigNumber(
            Math.floor(
                Math.random() * (Number.MAX_SAFE_INTEGER - 1),
            ) + 1,
        ).toFixed()

        const {
            value0: payload,
        } = await this.pair.contract.methods.buildExchangePayload({
            id: processingId,
            expected_amount: this.bill.minExpectedAmount,
            deploy_wallet_grams: deployGrams,
        }).call({
            cachedState: toJS(this.pair.state),
        })

        this.changeState('isSwapping', true)

        let stream = this.#transactionSubscriber?.transactions(this.wallet.account.address)

        const oldStream = this.#transactionSubscriber?.oldTransactions(this.wallet.account.address, {
            fromLt: this.wallet.contract?.lastTransactionId?.lt,
        })

        if (stream !== undefined && oldStream !== undefined) {
            stream = stream.merge(oldStream)
        }

        const resultHandler = stream?.flatMap(a => a.transactions).filterMap(async transaction => {
            const result = await this.wallet.walletContractCallbacks?.decodeTransaction({
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
                address: new Address(this.leftToken.wallet),
                grams: '2600000000',
                owner: this.wallet.account.address,
                payload,
                recipient: pairWallet,
                tokens: this.bill.amount,
            })

            if (resultHandler !== undefined) {
                E.match(
                    (r: SwapFailureResult) => this.handleSwapFailure(r),
                    (r: SwapSuccessResult) => this.handleSwapSuccess(r),
                )(await resultHandler)
            }
        }
        catch (e) {
            error('decodeTransaction error: ', e)
            this.changeState('isSwapping', false)
        }
    }

    /**
     * Manually start cross-exchange swap process.
     */
    public async crossExchangeSwap(): Promise<void> {
        const firstPair = this.bestCrossExchangeRoute?.pairs.slice().shift()
        if (
            this.wallet.account?.address === undefined
            || !this.isCrossExchangeSwapValid
            || this.leftTokenAddress === undefined
            || this.leftToken?.wallet === undefined
            || (firstPair?.address === undefined || firstPair.contract === undefined)
            || this.bestCrossExchangeRoute?.bill.amount === undefined
            || this.bestCrossExchangeRoute?.bill.minExpectedAmount === undefined
        ) {
            this.changeState('isSwapping', false)
            return
        }

        const tokens = this.bestCrossExchangeRoute?.tokens.slice()

        const deployGrams = tokens.concat(this.rightToken!).some(token => token.balance === undefined) ? '100000000' : '0'

        const pairWallet = await TokenWallet.walletAddress({
            root: this.leftTokenAddress,
            owner: firstPair.address,
        })

        const processingId = new BigNumber(
            Math.floor(
                Math.random() * (Number.MAX_SAFE_INTEGER - 1),
            ) + 1,
        ).toFixed()

        const steps = this.bestCrossExchangeRoute.steps.slice()

        const minExpectedAmount = steps.slice().shift()?.minExpectedAmount as string
        const params: DecodedAbiFunctionInputs<typeof DexAbi.Pair, 'buildCrossPairExchangePayload'> = {
            _answer_id: '0',
            id: processingId,
            expected_amount: minExpectedAmount,
            deploy_wallet_grams: deployGrams,
            steps: steps.slice(1, steps.length).map(
                ({ minExpectedAmount: amount, receiveAddress }) => ({ amount, root: receiveAddress }),
            ),
        }

        const {
            value0: payload,
        } = await firstPair.contract.methods.buildCrossPairExchangePayload(params).call({
            cachedState: toJS(firstPair.state),
        })

        this.changeState('isSwapping', true)

        let stream = this.#transactionSubscriber?.transactions(this.wallet.account.address)

        const oldStream = this.#transactionSubscriber?.oldTransactions(this.wallet.account.address, {
            fromLt: this.wallet.contract?.lastTransactionId?.lt,
        })

        if (stream !== undefined && oldStream !== undefined) {
            stream = stream.merge(oldStream)
        }

        let results: SwapRouteResult[] = steps.map(step => ({ step }))

        const resultHandler = stream?.flatMap(a => a.transactions).filterMap(async transaction => {
            const result = await this.wallet.walletContractCallbacks?.decodeTransaction({
                transaction,
                methods: ['dexPairExchangeSuccess', 'dexPairOperationCancelled'],
            })

            if (result !== undefined) {
                if (result.method === 'dexPairOperationCancelled' && result.input.id.toString() === processingId) {
                    results = results.map(
                        res => fillStepResult(
                            res,
                            transaction.inMessage.src,
                            undefined,
                            'cancel',
                        ),
                    )

                    if (results.some(({ status }) => status === undefined)) {
                        return undefined
                    }

                    const cancelStepIndex = results.findIndex(
                        ({ status }) => status === 'cancel',
                    )

                    if (cancelStepIndex === 0) {
                        return E.left({ step: results[0] })
                    }

                    if (cancelStepIndex > 0) {
                        return E.left({ step: results[cancelStepIndex - 1] })
                    }
                }

                if (result.method === 'dexPairExchangeSuccess' && result.input.id.toString() === processingId) {
                    results = results.map(
                        res => fillStepResult(
                            res,
                            transaction.inMessage.src,
                            result.input.result.received.toString(),
                            'success',
                        ),
                    )

                    if (results.some(({ status }) => status === undefined)) {
                        return undefined
                    }

                    if (results.every(({ status }) => status === 'success')) {
                        return E.right({ input: result.input, transaction })
                    }

                    const cancelStepIndex = results.findIndex(
                        ({ status }) => status === 'cancel',
                    )

                    if (cancelStepIndex === 0) {
                        return E.left({ step: results[0] })
                    }

                    if (cancelStepIndex > 0) {
                        return E.left({ step: results[cancelStepIndex - 1] })
                    }
                }
            }

            return undefined
        }).first()

        try {
            await TokenWallet.send({
                address: new Address(this.leftToken.wallet),
                grams: new BigNumber(steps.length)
                    .times(1000000000)
                    .plus(1500000000)
                    .plus(deployGrams)
                    .toFixed(),
                owner: this.wallet.account.address,
                payload,
                recipient: pairWallet,
                tokens: this.bestCrossExchangeRoute?.bill.amount,
            })

            if (resultHandler !== undefined) {
                E.match(
                    (r: SwapFailureResult) => this.handleSwapFailure(r),
                    (r: SwapSuccessResult) => this.handleSwapSuccess(r),
                )(await resultHandler)
            }
        }
        catch (e) {
            error('decodeTransaction error: ', e)
            this.changeState('isSwapping', false)
        }
    }

    /**
     * Manually recalculate swap bill by current direction.
     * @protected
     */
    public async recalculate(force?: boolean): Promise<void> {
        if (!force && this.isCalculating) {
            return
        }

        if (this.pair?.address === undefined && !this.isCrossExchangeAvailable) {
            this.changeData('priceLeftToRight', undefined)
            this.changeData('priceRightToLeft', undefined)
            this.changeState('isEnoughLiquidity', false)
            debug(
                '#recalculate reset when no pair',
                toJS(this.data), toJS(this.state), toJS(this.bill),
            )
            return
        }

        this.changeState(
            'isEnoughLiquidity',
            !this.pairLeftBalanceNumber.isZero()
            && !this.pairRightBalanceNumber.isZero(),
        )

        if (this.direction === SwapDirection.LTR) {
            if (this.isLeftAmountValid) {
                await this.calculateByLeftAmount(force)
            }

            if (this.isLeftAmountValid && this.isCrossExchangeAvailable) {
                await this.calculateLtrCrossExchangeBill(force)
            }
        }
        else if (this.direction === SwapDirection.RTL) {
            if (this.isRightAmountValid) {
                await this.calculateByRightAmount(force)
            }

            if (this.isRightAmountValid && this.isCrossExchangeAvailable) {
                await this.calculateRtlCrossExchangeBill(force)
            }
        }
    }

    /**
     * Manually toggle swap direction.
     * Reset swap bill. Revert prices, amounts and tokens.
     */
    public async toggleDirection(): Promise<void> {
        if (this.isLoading || this.isSwapping) {
            return
        }

        const {
            leftAmount,
            rightAmount,
            leftToken,
            rightToken,
            priceLeftToRight,
            priceRightToLeft,
        } = this.data

        this.changeData('priceLeftToRight', priceRightToLeft)
        this.changeData('priceRightToLeft', priceLeftToRight)

        this.changeData('leftToken', rightToken)
        this.changeData('rightToken', leftToken)

        if (this.direction === SwapDirection.RTL) {
            this.changeState('direction', SwapDirection.LTR)
            this.changeData('leftAmount', rightAmount)
            this.changeData('rightAmount', '')
        }
        else if (this.direction === SwapDirection.LTR) {
            this.changeState('direction', SwapDirection.RTL)
            this.changeData('rightAmount', leftAmount)
            this.changeData('leftAmount', '')
        }

        this.forceInvalidate()
    }

    /**
     * Manually toggle price direction
     */
    public togglePriceDirection(): void {
        if (this.priceDirection === SwapDirection.LTR) {
            this.changeState('priceDirection', SwapDirection.RTL)
            return
        }
        this.changeState('priceDirection', SwapDirection.LTR)
    }

    /**
     * Manually toggle swap exchange mode
     */
    public toggleSwapExchangeMode(): void {
        if (!this.isCrossExchangeMode && this.isCrossExchangeAvailable) {
            this.toCrossExchangeSwap()
            return
        }
        this.toDirectSwap()
    }

    public toCrossExchangeSwap(): void {
        this.changeState('exchangeMode', SwapExchangeMode.CROSS_PAIR_EXCHANGE)
    }

    public toDirectSwap(): void {
        this.changeState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
    }

    /**
     * Manually clean last transaction receipt result.
     */
    public cleanTransactionResult(): void {
        this.transactionReceipt = undefined
    }

    /**
     * Invalidate bills
     */
    public forceInvalidate(): void {
        this.resetBill()
        this.changeData('bestCrossExchangeRoute', undefined)
        this.finalizeDirectCalculation()
    }


    /*
     * Reactions handlers
     * ----------------------------------------------------------------------------------
     */

    /**
     * Handle slippage tolerance value change.
     * @param {string} value
     * @param {string} prevValue
     * @protected
     */
    protected async handleSlippageChange(value: string, prevValue: string): Promise<void> {
        if (
            value !== prevValue
            && isAmountValid(new BigNumber(value || 0))
        ) {
            if (this.isCrossExchangeMode) {
                this.changeData('bestCrossExchangeRoute', undefined)
                await this.recalculate(!this.isCalculating)
            }

            if (this.bill.expectedAmount !== undefined) {
                this.changeBillData(
                    'minExpectedAmount',
                    getSlippageMinExpectedAmount(
                        new BigNumber(this.bill.expectedAmount || 0),
                        value,
                    ).toFixed(),
                )
            }
        }
    }

    /**
     * Handle tokens changes.
     * @param {(string | undefined)[]} [tokensRoots]
     * @param {(string | undefined)[]} [prevTokensRoots]
     * @returns {Promise<void>}
     * @protected
     */
    protected async handleTokensChange(
        tokensRoots: (string | undefined)[] = [],
        prevTokensRoots: (string | undefined)[] = [],
    ): Promise<void> {
        if (this.isPairChecking || this.isSwapping) {
            return
        }

        const [leftRoot, rightRoot] = tokensRoots
        const [prevLeftRoot, prevRightRoot] = prevTokensRoots

        const isLeftChanged = leftRoot !== prevLeftRoot
        const isRightChanged = rightRoot !== prevRightRoot
        const isToggleDirection = leftRoot === prevRightRoot && rightRoot === prevLeftRoot
        const isChanged = (isLeftChanged || isRightChanged) && !isToggleDirection

        // E.g. when selects left token same as right - we reset
        // right token selection and revert amounts.
        // Same with right token
        // FIXME: weird bug
        if (leftRoot === rightRoot) {
            if (isRightChanged) {
                const { leftAmount } = this
                this.changeData('rightAmount', leftAmount)
                this.changeData('leftAmount', '')
                this.changeState('direction', SwapDirection.RTL)
            }
            else if (isLeftChanged) {
                const { rightAmount } = this
                this.changeData('leftAmount', rightAmount)
                this.changeData('rightAmount', '')
                this.changeState('direction', SwapDirection.LTR)
            }
        }

        this.forceInvalidate()

        debug(
            '#handleTokensChange reset bill',
            toJS(this.data), toJS(this.state), toJS(this.bill),
        )

        if (!isToggleDirection) {
            this.resetCrossExchangeData()
            debug('#handleTokensChange reset cross-exchange data')
        }

        if (isChanged) {
            this.changeData('pair', undefined)
            debug('#handleTokensChange change token')
        }

        if (leftRoot === undefined || rightRoot === undefined) {
            this.changeData('pair', undefined)
            debug(
                '#handleTokensChange only one token selected -> reset',
                toJS(this.data), toJS(this.state), toJS(this.bill),
            )
            return
        }

        if (this.pair === undefined) {
            this.changeState('isPairChecking', true)

            try {
                const address = await checkPair(leftRoot, rightRoot)
                this.changeData(
                    'pair',
                    address !== undefined
                        ? {
                            address,
                            contract: new Contract(DexAbi.Pair, address),
                        }
                        : undefined,
                )
            }
            catch (e) {
                error('Check pair error', e)
                this.changeData('pair', undefined)
            }
        }

        if (this.pair?.address !== undefined && !isToggleDirection) {
            try {
                this.cleanPairUpdatesInterval()

                await this.syncPairState()
                await this.syncPairBalances()

                this.changeState(
                    'isEnoughLiquidity',
                    !this.pairLeftBalanceNumber.isZero()
                    && !this.pairRightBalanceNumber.isZero(),
                )

                await this.syncPairData()

                this.finalizeDirectCalculation()

                // this.#pairUpdatesUpdater = setInterval(async () => {
                //     await this.syncPairState()
                //     await this.syncPairBalances()
                //
                //     this.changeState(
                //         'isEnoughLiquidity',
                //         !this.pairLeftBalanceNumber.isZero()
                //         && !this.pairRightBalanceNumber.isZero(),
                //     )
                //
                //     await this.recalculate(!this.isCalculating)
                //
                //     debug('#handleTokensChange Update pair data by interval', toJS(this.pair))
                // }, 10000)
            }
            catch (e) {
                error('Sync pair data error', e)
            }
        }

        this.changeState('isPairChecking', false)

        if (isChanged) {
            await this.prepareCrossExchange()
            debug(
                '#handleTokensChange prepare cross-exchange',
                toJS(this.data), toJS(this.state), toJS(this.bill),
            )
        }

        await this.recalculate(!this.isCalculating)

        this.checkCrossExchange()

        debug(
            '#handleTokensChange check cross-exchange',
            toJS(this.data), toJS(this.state), toJS(this.bill),
        )
    }

    /**
     * Handle wallet account change.
     * @param {string} [walletAddress]
     * @protected
     */
    protected async handleWalletAccountChange(walletAddress?: string): Promise<void> {
        await this.dispose()
        if (walletAddress !== undefined) {
            await this.init()
            await this.recalculate(true)
        }
    }


    /*
     * Internal swap processing results handlers
     * ----------------------------------------------------------------------------------
     */

    /**
     * Success transaction callback handler
     * @param {SwapSuccessResult['input']} input
     * @param {SwapSuccessResult['transaction']} transaction
     * @protected
     */
    protected handleSwapSuccess({ input, transaction }: SwapSuccessResult): void {
        this.transactionReceipt = {
            hash: transaction.id.hash,
            receivedAmount: input.result.received.toString(),
            receivedDecimals: this.rightTokenDecimals,
            receivedIcon: this.rightToken?.icon,
            receivedRoot: this.rightToken?.root,
            receivedSymbol: this.rightToken?.symbol,
            spentAmount: input.result.spent.toString(),
            spentDecimals: this.leftTokenDecimals,
            spentFee: input.result.fee.toString(),
            spentSymbol: this.leftToken?.symbol,
            success: true,
        }

        this.changeState('isSwapping', false)
        this.changeData('leftAmount', '')
        this.changeData('rightAmount', '')
        this.forceInvalidate()
    }

    /**
     * Failure transaction callback handler
     * @param {SwapFailureResult} [_]
     * @protected
     */
    protected handleSwapFailure({ step }: SwapFailureResult): void {
        const rightToken = step?.step.receiveAddress !== undefined
            ? this.tokensCache.get(step.step.receiveAddress.toString())
            : undefined

        this.transactionReceipt = {
            isCrossExchangeCanceled: step !== undefined,
            receivedAmount: step?.amount,
            receivedDecimals: rightToken?.decimals,
            receivedIcon: rightToken?.icon,
            receivedRoot: rightToken?.root,
            receivedSymbol: rightToken?.symbol,
            success: false,
        }

        this.changeState('isSwapping', false)
        this.forceInvalidate()
    }

    /*
     * Internal utilities methods
     * ----------------------------------------------------------------------------------
     */

    /**
     * Calculate bill by the changes in the left amount field.
     * @param {boolean} [force] - pass `true` to calculate in background without loadings
     * @protected
     */
    protected async calculateByLeftAmount(force?: boolean): Promise<void> {
        if (
            !force
            && (
                this.isCalculating
                || this.leftToken === undefined
                || this.rightToken === undefined
            )
        ) {
            debug(
                '#calculateByLeftAmount reset before start',
                toJS(this.data), toJS(this.state), toJS(this.bill),
            )
            return
        }

        this.changeState('isCalculating', !force)

        debug(
            '#calculateByLeftAmount start',
            toJS(this.data), toJS(this.state), toJS(this.bill),
        )

        if (this.isEnoughLiquidity && this.isLeftAmountValid && this.leftTokenAddress !== undefined) {
            this.changeBillData(
                'amount',
                this.leftAmountNumber
                    .shiftedBy(this.leftTokenDecimals)
                    .dp(0, BigNumber.ROUND_DOWN)
                    .toFixed(),
            )

            if (this.pair?.contract !== undefined) {
                let expectedAmountBN = new BigNumber(0),
                    expectedFee

                try {
                    const {
                        expected_amount: expectedAmount,
                        expected_fee: expectedExchangeFee,
                    } = await getExpectedExchange(
                        this.pair.contract,
                        this.bill.amount || '0',
                        this.leftTokenAddress,
                        toJS(this.pair.state),
                    )

                    expectedAmountBN = new BigNumber(expectedAmount || 0)
                    expectedFee = expectedExchangeFee
                }
                catch (e) {}

                this.changeBillData('expectedAmount', expectedAmountBN.toFixed())
                this.changeBillData('fee', expectedFee || '0')
                this.changeBillData(
                    'minExpectedAmount',
                    getSlippageMinExpectedAmount(expectedAmountBN, this.data.slippage).toFixed(),
                )

                this.changeData(
                    'rightAmount',
                    isAmountValid(expectedAmountBN, this.rightTokenDecimals)
                        ? expectedAmountBN.shiftedBy(-this.rightTokenDecimals).toFixed()
                        : '',
                )
            }
        }

        this.finalizeDirectCalculation()

        this.changeState('isCalculating', false)

        debug(
            '#calculateByLeftAmount done',
            toJS(this.data), toJS(this.state), toJS(this.bill),
        )
    }

    /**
     * Calculate bill by the changes in the right amount field.
     * @param {boolean} [force] - pass `true` to calculate in background without loadings
     * @protected
     */
    protected async calculateByRightAmount(force?: boolean): Promise<void> {
        if (
            !force
            && (
                this.isCalculating
                || this.leftToken === undefined
                || this.rightToken === undefined
            )
        ) {
            debug(
                '#calculateByRightAmount reset before start',
                toJS(this.data), toJS(this.state), toJS(this.bill),
            )
            return
        }

        this.changeState('isCalculating', !force)

        debug(
            '#calculateByRightAmount start',
            toJS(this.data), toJS(this.state), toJS(this.bill),
        )

        if (this.isEnoughLiquidity && this.isRightAmountValid) {
            this.changeState(
                'isEnoughLiquidity',
                this.rightAmountNumber.shiftedBy(this.rightTokenDecimals).lt(
                    this.isPairInverted ? this.pairLeftBalanceNumber : this.pairRightBalanceNumber,
                ),
            )

            if (!this.isEnoughLiquidity) {
                this.changeData('leftAmount', '')
            }
        }

        if (this.isEnoughLiquidity && this.isRightAmountValid && this.rightTokenAddress !== undefined) {
            let expectedAmountBN = this.rightAmountNumber
                .shiftedBy(this.rightTokenDecimals)
                .dp(0, BigNumber.ROUND_DOWN)

            this.changeBillData('expectedAmount', expectedAmountBN.toFixed())

            this.changeBillData(
                'minExpectedAmount',
                getSlippageMinExpectedAmount(expectedAmountBN, this.data.slippage).toFixed(),
            )

            if (this.pair?.contract !== undefined) {
                let expectedFee
                try {
                    const {
                        expected_amount: expectedAmount,
                        expected_fee: expectedSpentFee,
                    } = await getExpectedSpendAmount(
                        this.pair.contract,
                        expectedAmountBN.toFixed(),
                        this.rightTokenAddress,
                        toJS(this.pair.state),
                    )

                    expectedAmountBN = new BigNumber(expectedAmount || 0)
                    expectedFee = expectedSpentFee
                }
                catch (e) {}

                if (isAmountValid(expectedAmountBN)) {
                    this.changeBillData('amount', expectedAmountBN.toFixed())
                    this.changeBillData('fee', expectedFee)
                    this.changeData(
                        'leftAmount',
                        expectedAmountBN.shiftedBy(-this.leftTokenDecimals).toFixed(),
                    )
                }
                else {
                    this.changeData('leftAmount', '')
                    this.changeData('rightAmount', '')
                }
            }
        }

        this.finalizeDirectCalculation()

        this.changeState('isCalculating', false)

        debug(
            '#calculateByRightAmount done',
            toJS(this.data), toJS(this.state), toJS(this.bill),
        )
    }

    /**
     * Finalize direct amount change.
     * Calculate prices by sides and price impact.
     * @protected
     */
    protected finalizeDirectCalculation(): void {
        if (!this.isEnoughLiquidity) {
            this.changeData('priceLeftToRight', undefined)
            this.changeData('priceRightToLeft', undefined)
            return
        }

        const pairLeftBalanceBN = this.isPairInverted ? this.pairRightBalanceNumber : this.pairLeftBalanceNumber
        const pairRightBalanceBN = this.isPairInverted ? this.pairLeftBalanceNumber : this.pairRightBalanceNumber

        let priceLeftToRight = getDefaultPerPrice(
                pairLeftBalanceBN.shiftedBy(-this.leftTokenDecimals),
                pairRightBalanceBN.shiftedBy(-this.rightTokenDecimals),
                this.leftTokenDecimals,
            ),
            priceRightToLeft = getDefaultPerPrice(
                pairRightBalanceBN.shiftedBy(-this.rightTokenDecimals),
                pairLeftBalanceBN.shiftedBy(-this.leftTokenDecimals),
                this.rightTokenDecimals,
            )

        if (
            !this.isRightAmountValid
            || this.bill.amount === undefined
            || this.bill.expectedAmount === undefined
            || this.pair === undefined
            || this.pair.contract === undefined
            || this.pair.denominator === undefined
            || this.pair.numerator === undefined
        ) {
            if (isAmountValid(priceLeftToRight)) {
                this.changeData('priceLeftToRight', priceLeftToRight.toFixed())
            }

            if (isAmountValid(priceRightToLeft)) {
                this.changeData('priceRightToLeft', priceRightToLeft.toFixed())
            }

            return
        }

        let amountBN = new BigNumber(this.bill.amount || 0)
        const expectedAmountBN = new BigNumber(this.bill.expectedAmount || 0)

        priceLeftToRight = getExchangePerPrice(
            amountBN,
            expectedAmountBN,
            this.rightTokenDecimals,
        )

        priceRightToLeft = getExchangePerPrice(
            expectedAmountBN,
            amountBN,
            this.leftTokenDecimals,
        )

        amountBN = amountBN
            .times(new BigNumber(this.pair.denominator).minus(this.pair.numerator))
            .div(this.pair.denominator)

        this.changeBillData(
            'priceImpact',
            getDirectExchangePriceImpact(
                pairRightBalanceBN.div(pairLeftBalanceBN).times(amountBN),
                expectedAmountBN,
            ).toFixed(),
        )

        if (isAmountValid(priceLeftToRight)) {
            this.changeData('priceLeftToRight', priceLeftToRight.toFixed())
        }

        if (isAmountValid(priceRightToLeft)) {
            this.changeData('priceRightToLeft', priceRightToLeft.toFixed())
        }
    }

    /**
     * Change direct swap bill by the given key and value.
     * @param {K extends keyof SwapBill} key
     * @param {SwapBill[K]} value
     */
    protected changeBillData<K extends keyof SwapBill>(key: K, value: SwapBill[K]): void {
        this.bill[key] = value
    }

    /**
     * Try to unsubscribe from direct transaction subscriber.
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
     * Clean direct pair updates interval.
     * @protected
     */
    protected cleanPairUpdatesInterval(): void {
        if (this.#pairUpdatesUpdater !== undefined) {
            clearInterval(this.#pairUpdatesUpdater)
            this.#pairUpdatesUpdater = undefined
        }
    }

    /**
     * Full reset.
     * Reset direct swap `bill`, cross-exchange swap `bill`,
     * `data` and `state` to their default.
     * @protected
     */
    protected reset(): void {
        this.forceInvalidate()
        this.resetCrossExchangeData()
        this.resetData()
        this.resetState()
    }

    /**
     * Reset swap direct `bill` to their defaults
     * and invalidate cross-exchange `bill`.
     * @protected
     */
    protected resetBill(): void {
        this.bill = DEFAULT_SWAP_BILL
    }

    /**
     * Reset swap `data` to their defaults.
     * @protected
     */
    protected resetData(): void {
        this.data = {
            ...DEFAULT_SWAP_STORE_DATA,
            leftToken: this.data.leftToken,
            rightToken: this.data.rightToken,
        }
    }

    /**
     * Reset swap `state` to their defaults.
     * @protected
     */
    protected resetState(): void {
        this.state = DEFAULT_SWAP_STORE_STATE
    }

    /**
     * Sync and update direct pair token.
     * Fetch pair token roots, denominator and numerator.
     * @returns {Promise<void>}
     * @protected
     */
    protected async syncPairData(): Promise<void> {
        if (this.pair?.contract === undefined) {
            return
        }

        const [
            { left, right },
            { denominator, numerator },
        ] = await Promise.all([
            this.pair.contract.methods.getTokenRoots({
                _answer_id: 0,
            }).call({
                cachedState: toJS(this.pair.state),
            }),
            this.pair.contract.methods.getFeeParams({
                _answer_id: 0,
            }).call({
                cachedState: toJS(this.pair.state),
            }),
        ])

        this.changeData('pair', {
            ...this.pair,
            denominator,
            numerator,
            roots: { left, right },
        })
    }

    /**
     * Sync and update direct pair token left and right balances.
     * @protected
     */
    protected async syncPairBalances(): Promise<void> {
        if (this.pair?.contract === undefined) {
            return
        }

        try {
            const [
                { left_balance: left },
                { right_balance: right },
            ] = await Promise.all([
                this.pair.contract.methods.left_balance({}).call({
                    cachedState: toJS(this.pair.state),
                }),
                this.pair.contract.methods.right_balance({}).call({
                    cachedState: toJS(this.pair.state),
                }),
            ])

            this.changeData('pair', {
                ...this.pair,
                balances: { left, right },
            })
        }
        catch (e) {
            error(e)
        }
    }

    /**
     * Sync and update direct pair token full contract state.
     * @protected
     */
    protected async syncPairState(): Promise<void> {
        if (
            this.pair?.contract === undefined
            || this.pair.address === undefined
        ) {
            return
        }

        const { state } = await ton.getFullContractState({
            address: this.pair.address,
        })

        this.changeData('pair', { ...this.pair, state })
    }


    /*
     * Cross-exchange methods
     * ----------------------------------------------------------------------------------
     */

    /**
     * Calculate cross-exchange `bill` by the changes in the left field.
     * @param {boolean} [force] - pass `true` to calculate in background without loadings
     * @protected
     */
    protected async calculateLtrCrossExchangeBill(force?: boolean): Promise<void> {
        if (
            this.leftToken === undefined
            || this.rightToken === undefined
            || !this.isLeftAmountValid
        ) {
            return
        }

        if (!force && this.isCrossExchangeCalculating) {
            return
        }

        const amountBN = this.leftAmountNumber
            .shiftedBy(this.leftTokenDecimals)
            .dp(0, BigNumber.ROUND_DOWN)

        this.changeState('isCrossExchangeCalculating', !force)

        debug(
            '#calculateLtrCrossExchangeBill invalidate routes',
            toJS(this.data), toJS(this.state), toJS(this.bill),
        )

        await (
            async () => {
                const routes: SwapRoute[] = []

                // eslint-disable-next-line no-restricted-syntax
                for (const _route of this.routes) {
                    const route = { ..._route }
                    const tokens = this.getRouteTokensMap(route.tokens, true)

                    route.bill.amount = amountBN.toFixed()
                    route.bill.expectedAmount = amountBN.toFixed()
                    route.bill.minExpectedAmount = amountBN.toFixed()
                    route.pairs = []
                    route.steps = []

                    // eslint-disable-next-line no-restricted-syntax
                    for (const { idx, token } of tokens) {
                        if (idx + 1 < tokens.length) {
                            // noinspection DuplicatedCode
                            const { token: nextToken } = tokens[idx + 1]
                            const pair = this.getRouteStepPair(token.root, nextToken.root)

                            if (pair?.address === undefined) {
                                break
                            }

                            if (pair.contract === undefined) {
                                pair.contract = new Contract(DexAbi.Pair, pair.address)
                            }

                            route.pairs.push(pair)

                            const spentTokenAddress = new Address(token.root)

                            try {
                                // todo: maybe with Promise.all ?
                                const {
                                    expected_amount: expectedAmount,
                                    expected_fee: expectedFee,
                                } = await getExpectedExchange(
                                    pair.contract,
                                    route.bill.expectedAmount!,
                                    spentTokenAddress,
                                    toJS(pair.state),
                                )

                                const {
                                    expected_amount: minExpectedAmount,
                                } = await getExpectedExchange(
                                    pair.contract,
                                    route.bill.minExpectedAmount!,
                                    spentTokenAddress,
                                    toJS(pair.state),
                                )

                                route.bill._minExpectedAmount = minExpectedAmount as string
                                route.bill.minExpectedAmount = getSlippageMinExpectedAmount(
                                    new BigNumber(minExpectedAmount || 0),
                                    this.data.slippage,
                                ).toFixed() as string

                                route.steps.push({
                                    amount: route.bill.expectedAmount!,
                                    expectedAmount,
                                    fee: expectedFee,
                                    from: token.symbol,
                                    minExpectedAmount: route.bill.minExpectedAmount,
                                    pair,
                                    receiveAddress: new Address(nextToken.root),
                                    spentAddress: spentTokenAddress,
                                    to: nextToken.symbol,
                                })

                                route.bill.expectedAmount = expectedAmount as string
                            }
                            catch (e) {
                                route.bill = {}
                                route.pairs = []
                                route.steps = []
                                error('Get expected amounts error', e, route, token)
                            }
                        }
                    }

                    routes.push(route)
                }

                this.changeData('routes', routes)
            }
        )()

        const currentRoute = this.data.bestCrossExchangeRoute && { ...this.data.bestCrossExchangeRoute }
        const prevAmountBN = currentRoute?.bill.amount !== undefined
            ? new BigNumber(currentRoute.bill.amount || 0)
            : amountBN
        const isAmountDecreased = prevAmountBN.gt(amountBN)
        const directMinExpectedAmount = new BigNumber(this.bill.minExpectedAmount || 0)
        let bestMinExpectedAmount = new BigNumber(
                isAmountDecreased ? 0 : (currentRoute?.bill.minExpectedAmount || 0),
            ),
            bestCrossExchangeRoute: SwapRoute | undefined

        this.changeData('bestCrossExchangeRoute', undefined)

        // eslint-disable-next-line no-restricted-syntax
        for (const route of this.routes) {
            if (route.steps.length === 0) {
                break
            }

            const minExpectedAmount = new BigNumber(route.bill.minExpectedAmount || 0)

            if (
                minExpectedAmount.gt(directMinExpectedAmount)
                && minExpectedAmount.gt(bestMinExpectedAmount)
            ) {
                const expectedAmount = route.bill.expectedAmount || '0'
                const expectedAmountBN = new BigNumber(expectedAmount).shiftedBy(-this.rightTokenDecimals)
                const fee = getReducedCrossExchangeFee(route.steps)
                const amount = getReducedCrossExchangeAmount(
                    this.leftAmountNumber,
                    this.leftToken,
                    route.pairs,
                )
                const priceImpact = getCrossExchangePriceImpact(amount, expectedAmountBN)

                const prices: Pick<SwapRoute, 'priceLeftToRight' | 'priceRightToLeft'> = {}

                const priceLeftToRight = getExchangePerPrice(
                    this.leftAmountNumber,
                    expectedAmountBN,
                    this.leftTokenDecimals,
                )

                const priceRightToLeft = getExchangePerPrice(
                    expectedAmountBN,
                    this.leftAmountNumber,
                    this.rightTokenDecimals,
                )

                if (isAmountValid(priceLeftToRight)) {
                    prices.priceLeftToRight = priceLeftToRight.toFixed()
                }

                if (isAmountValid(priceRightToLeft)) {
                    prices.priceRightToLeft = priceRightToLeft.toFixed()
                }

                bestCrossExchangeRoute = {
                    ...route,
                    ...prices,
                    bill: {
                        ...route.bill,
                        expectedAmount,
                        fee: fee.toFixed(),
                        priceImpact: priceImpact.toFixed(),
                    },
                    leftAmount: this.leftAmountNumber.toFixed(),
                    rightAmount: expectedAmountBN.toFixed(),
                    slippage: getCrossExchangeSlippage(this.data.slippage, route.steps.length),
                }

                bestMinExpectedAmount = new BigNumber(bestCrossExchangeRoute?.bill.minExpectedAmount || 0)
            }
        }

        this.changeData('bestCrossExchangeRoute', bestCrossExchangeRoute)

        if (bestCrossExchangeRoute === undefined) {
            this.toDirectSwap()
        }

        this.changeState('isCrossExchangeCalculating', false)

        debug(
            '#calculateLtrCrossExchangeBill done',
            toJS(this.data), toJS(this.state), toJS(this.bill),
        )
    }

    /**
     * Calculate cross-exchange `bill` by the changes in the right field.
     * @param {boolean} [force] - pass `true` to calculate in background without loadings
     * @protected
     */
    protected async calculateRtlCrossExchangeBill(force?: boolean): Promise<void> {
        if (
            this.leftToken === undefined
            || this.rightToken === undefined
            || !this.isRightAmountValid
        ) {
            return
        }

        if (!force && this.isCrossExchangeCalculating) {
            return
        }

        const amountBN = this.rightAmountNumber
            .shiftedBy(this.rightTokenDecimals)
            .dp(0, BigNumber.ROUND_DOWN)

        this.changeState('isCrossExchangeCalculating', !force)

        debug(
            '#calculateRtlCrossExchangeBill invalidate routes',
            toJS(this.data), toJS(this.state), toJS(this.bill),
        )

        await (
            async () => {
                const routes: SwapRoute[] = []

                // eslint-disable-next-line no-restricted-syntax
                for (const _route of this.routes) {
                    const route = { ..._route }
                    const tokens = this.getRouteTokensMap(route.tokens, false)

                    route.bill.amount = amountBN.toFixed()
                    route.bill.expectedAmount = amountBN.toFixed()
                    route.bill.minExpectedAmount = amountBN.toFixed()
                    route.pairs = []
                    route.steps = []

                    // eslint-disable-next-line no-restricted-syntax
                    for (const { idx, token } of tokens) {
                        if (idx + 1 < tokens.length) {
                            // noinspection DuplicatedCode
                            const { token: nextToken } = tokens[idx + 1]
                            const pair = this.getRouteStepPair(token.root, nextToken.root)

                            if (pair?.address === undefined) {
                                break
                            }

                            if (pair.contract === undefined) {
                                pair.contract = new Contract(DexAbi.Pair, pair.address)
                            }

                            route.pairs.push(pair)

                            const receiveTokenAddress = new Address(token.root)

                            try {
                                const {
                                    expected_amount: expectedAmount,
                                    expected_fee: expectedFee,
                                } = await getExpectedSpendAmount(
                                    pair.contract,
                                    route.bill.expectedAmount!,
                                    receiveTokenAddress,
                                    toJS(pair.state),
                                )

                                route.steps.unshift({
                                    amount: expectedAmount,
                                    expectedAmount: route.bill.expectedAmount!,
                                    fee: expectedFee,
                                    from: nextToken.symbol,
                                    minExpectedAmount: route.bill.minExpectedAmount!,
                                    pair,
                                    receiveAddress: receiveTokenAddress,
                                    spentAddress: new Address(nextToken.root),
                                    to: token.symbol,
                                })

                                route.bill.expectedAmount = expectedAmount as string
                            }
                            catch (e) {
                                route.bill = {}
                                route.pairs = []
                                route.steps = []
                                error('Get expected spend amounts error', e, route, token)
                            }
                        }
                    }

                    routes.push(route)
                }

                this.changeData('routes', routes)
            }
        )()

        await (
            async () => {
                const routes: SwapRoute[] = []

                // eslint-disable-next-line no-restricted-syntax
                for (const _route of this.routes) {
                    const route = { ..._route }
                    const steps = route.steps.map((step, idx) => ({ idx, step }))

                    // eslint-disable-next-line no-restricted-syntax
                    for (const { idx, step } of steps) {
                        if (step.pair?.address === undefined) {
                            break
                        }

                        if (step.pair.contract === undefined) {
                            step.pair.contract = new Contract(DexAbi.Pair, step.pair.address)
                        }

                        try {
                            const {
                                expected_amount: minExpectedAmount,
                            } = await getExpectedExchange(
                                step.pair.contract,
                                idx === 0 ? route.bill.expectedAmount! : route.bill.minExpectedAmount!,
                                step.spentAddress,
                                toJS(step.pair.state),
                            )

                            route.bill._minExpectedAmount = minExpectedAmount as string
                            route.bill.minExpectedAmount = getSlippageMinExpectedAmount(
                                new BigNumber(minExpectedAmount || 0),
                                this.data.slippage,
                            ).toFixed() as string

                            step.minExpectedAmount = route.bill.minExpectedAmount
                        }
                        catch (e) {
                            error('Min expected amount reverse by right error', e)
                        }
                    }

                    routes.push(route)
                }

                this.changeData('routes', routes)
            }
        )()

        const currentRoute = this.data.bestCrossExchangeRoute && { ...this.data.bestCrossExchangeRoute }
        const prevAmountBN = currentRoute?.bill.amount !== undefined
            ? new BigNumber(currentRoute.bill.amount || 0)
            : amountBN
        const isAmountDecreased = prevAmountBN.gte(amountBN)
        const directMinExpectedAmount = new BigNumber(this.bill.minExpectedAmount || 0)
        let bestMinExpectedAmount = new BigNumber(
                isAmountDecreased ? 0 : (currentRoute?.bill.minExpectedAmount || 0),
            ),
            bestCrossExchangeRoute: SwapRoute | undefined

        this.changeData('bestCrossExchangeRoute', undefined)

        // eslint-disable-next-line no-restricted-syntax
        for (const route of this.routes) {
            if (route.steps.length === 0) {
                break
            }

            const minExpectedAmount = new BigNumber(route.bill.minExpectedAmount || 0)

            if (
                !this.isEnoughLiquidity
                || (directMinExpectedAmount.isZero() && minExpectedAmount.gt(0))
                || (directMinExpectedAmount.gt(minExpectedAmount) && bestMinExpectedAmount.gt(minExpectedAmount))
            ) {
                const expectedAmount = route.bill.expectedAmount || '0'
                const expectedAmountBN = new BigNumber(expectedAmount).shiftedBy(-this.leftTokenDecimals)
                const fee = getReducedCrossExchangeFee(route.steps)
                const amount = getReducedCrossExchangeAmount(
                    expectedAmountBN,
                    this.leftToken,
                    route.pairs.slice().reverse(),
                )
                const priceImpact = getCrossExchangePriceImpact(amount, this.rightAmountNumber)

                const prices: Pick<SwapRoute, 'priceLeftToRight' | 'priceRightToLeft'> = {}

                const priceLeftToRight = getExchangePerPrice(
                    expectedAmountBN,
                    this.rightAmountNumber,
                    this.leftTokenDecimals,
                )

                const priceRightToLeft = getExchangePerPrice(
                    this.rightAmountNumber,
                    expectedAmountBN,
                    this.rightTokenDecimals,
                )

                if (isAmountValid(priceLeftToRight)) {
                    prices.priceLeftToRight = priceLeftToRight.toFixed()
                }

                if (isAmountValid(priceRightToLeft)) {
                    prices.priceRightToLeft = priceRightToLeft.toFixed()
                }

                bestCrossExchangeRoute = {
                    ...route,
                    ...prices,
                    bill: {
                        ...route.bill,
                        expectedAmount,
                        fee: fee.toFixed(),
                        priceImpact: priceImpact.toFixed(),
                    },
                    leftAmount: expectedAmountBN.toFixed(),
                    rightAmount: this.rightAmountNumber.toFixed(),
                    slippage: getCrossExchangeSlippage(this.data.slippage, route.steps.length),
                }

                bestMinExpectedAmount = new BigNumber(bestCrossExchangeRoute?.bill.minExpectedAmount || 0)
            }
        }

        this.changeData('bestCrossExchangeRoute', bestCrossExchangeRoute)

        if (bestCrossExchangeRoute === undefined) {
            this.toDirectSwap()
        }

        this.changeState('isCrossExchangeCalculating', false)

        debug(
            '#calculateRtlCrossExchangeBill done', force,
            toJS(this.data), toJS(this.state), toJS(this.bill),
        )
    }

    /**
     *
     * @param {TokenCache[]} routeTokens
     * @param {boolean} isLtr
     * @protected
     */
    protected getRouteTokensMap(routeTokens: TokenCache[], isLtr: boolean): { idx: number, token: TokenCache }[] {
        if (this.leftToken === undefined || this.rightToken === undefined) {
            return []
        }

        const tokens = [
            this.leftToken,
            ...routeTokens.slice(),
            this.rightToken,
        ]

        if (!isLtr) {
            tokens.reverse()
        }

        return tokens.map((token, idx) => ({ idx, token }))
    }

    /**
     *
     * @param {string} leftRoot
     * @param {string} rightRoot
     * @protected
     */
    protected getRouteStepPair(leftRoot: string, rightRoot: string): SwapPair | undefined {
        return this.data.crossPairs.find(
            ({ roots }) => {
                const leftPairRoot = roots?.left.toString()
                const rightPairRoot = roots?.right.toString()
                return (
                    (leftRoot === leftPairRoot && rightRoot === rightPairRoot)
                    || (leftRoot === rightPairRoot && rightRoot === leftPairRoot)
                )
            },
        )
    }

    /**
     * Checks if we should be toggle to cross-exchange mode.
     * Toggle to cross-exchange mode if:
     * - direct pair token doesn't exists or exists, but pool haven't enough liquidity
     * - cross-exchange is available - has 1 or more routes and has best route
     * @protected
     */
    protected checkCrossExchange(): void {
        if (this.pair === undefined && this.isCrossExchangeAvailable) {
            this.changeState('exchangeMode', SwapExchangeMode.CROSS_PAIR_EXCHANGE)
            return
        }

        if (
            (!this.isEnoughLiquidity || this.pair === undefined)
            && this.isCrossExchangeAvailable
            && !this.isCrossExchangeMode
        ) {
            this.changeState('exchangeMode', SwapExchangeMode.CROSS_PAIR_EXCHANGE)
        }
    }

    /**
     * Load cross-pairs for each selected token,
     * find intersections and make cross-exchange routes.
     * Load and save all pairs.
     * Create routes by white list.
     * Check tokens wallets.
     * @protected
     */
    protected async prepareCrossExchange(): Promise<void> {
        if (
            this.isCrossExchangePreparing
            || this.isSwapping
            || this.leftToken === undefined
            || this.rightToken === undefined
        ) {
            return
        }

        let response: PairsResponse[] | undefined

        this.changeState('isCrossExchangePreparing', true)

        try {
            response = await this.loadCrossPairs()
        }
        catch (e) {
            error('Load cross-pairs error', e)
        }

        if (response === undefined) {
            this.changeState('isCrossExchangePreparing', false)
            return
        }

        const [leftTokenPairs, rightTokenPairs] = response

        const leftPairs = leftTokenPairs.pairs.filter(
            ({ tvl }) => new BigNumber(tvl).dp(0, BigNumber.ROUND_DOWN).gte(100000),
        )
        const rightPairs = rightTokenPairs.pairs.filter(
            ({ tvl }) => new BigNumber(tvl).dp(0, BigNumber.ROUND_DOWN).gte(100000),
        )

        const crossPairs: SwapPair[] = [...leftPairs, ...rightPairs].map(({ meta }) => {
            const pair: SwapPair = {
                address: new Address(meta.poolAddress),
                contract: new Contract(DexAbi.Pair, new Address(meta.poolAddress)),
                decimals: {
                    left: DEFAULT_DECIMALS,
                    right: DEFAULT_DECIMALS,
                },
                roots: {
                    left: new Address(meta.baseAddress),
                    right: new Address(meta.counterAddress),
                },
                symbols: {
                    left: meta.base,
                    right: meta.counter,
                },
            }

            if (pair.roots?.left !== undefined && pair.roots?.right !== undefined) {
                const leftToken = this.tokensCache.get(meta.baseAddress)
                pair.decimals!.left = leftToken?.decimals || DEFAULT_DECIMALS
                const rightToken = this.tokensCache.get(meta.counterAddress)
                pair.decimals!.right = rightToken?.decimals || DEFAULT_DECIMALS
            }

            return pair
        }).filter(pair => pair.address?.toString() !== this.pair?.address?.toString())

        this.changeData('crossPairs', crossPairs)

        await this.syncCrossExchangePairsStates()
        await this.syncCrossExchangePairs()
        await this.syncCrossExchangePairsBalances()

        const leftRoots = leftPairs.map(
            ({ meta }) => [meta.baseAddress, meta.counterAddress],
        )
        const rightRoots = rightPairs.map(
            ({ meta }) => [meta.baseAddress, meta.counterAddress],
        )

        const intersections = intersection(...leftRoots, ...rightRoots).filter(
            root => ![this.leftToken?.root, this.rightToken?.root].includes(root),
        )

        const routes: SwapRoute[] = []

        try {
            await (
                async () => {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const root of CROSS_PAIR_EXCHANGE_WHITE_LIST) {
                        if (intersections.includes(root)) {
                            const token = this.tokensCache.get(root)
                            if (token !== undefined) {
                                await this.tokensCache.syncToken(token.root)

                                routes.push({
                                    bill: {},
                                    leftAmount: this.leftAmount,
                                    pairs: [],
                                    rightAmount: this.rightAmount,
                                    steps: [],
                                    tokens: [token],
                                })
                            }
                        }
                    }
                }
            )()
        }
        catch (e) {}
        finally {
            this.changeData('routes', routes)
            this.changeState('isCrossExchangePreparing', false)
        }
    }

    /**
     * Sync and update all cross-exchange pairs.
     * Fetch denominator and numerator.
     * @protected
     */
    protected async syncCrossExchangePairs(): Promise<void> {
        try {
            await (
                async () => {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const pair of this.data.crossPairs) {
                        if (pair.address === undefined) {
                            break
                        }

                        if (pair.contract === undefined) {
                            pair.contract = new Contract(DexAbi.Pair, pair.address)
                        }

                        const {
                            denominator,
                            numerator,
                        } = await pair.contract.methods.getFeeParams({
                            _answer_id: 0,
                        }).call({
                            cachedState: toJS(pair.state),
                        })

                        pair.denominator = denominator
                        pair.numerator = numerator
                    }
                }
            )()
        }
        catch (e) {
            error('Sync cross exchange pairs error', e)
        }
    }

    /**
     * Sync and update all cross-exchange pairs balances.
     * @protected
     */
    protected async syncCrossExchangePairsBalances(): Promise<void> {
        try {
            await (
                async () => {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const pair of this.data.crossPairs) {
                        if (pair.address === undefined) {
                            break
                        }

                        if (pair.contract === undefined) {
                            pair.contract = new Contract(DexAbi.Pair, pair.address)
                        }

                        const [
                            { left_balance: leftBalance },
                            { right_balance: rightBalance },
                        ] = await Promise.all([
                            pair.contract.methods.left_balance({}).call({
                                cachedState: toJS(pair.state),
                            }),
                            pair.contract.methods.right_balance({}).call({
                                cachedState: toJS(pair.state),
                            }),
                        ])

                        pair.balances = {
                            left: leftBalance,
                            right: rightBalance,
                        }
                    }
                }
            )()
        }
        catch (e) {
            error('Sync cross exchange pairs balances error', e)
        }
    }

    /**
     * Sync and update all cross-exchange pairs full contracts states.
     * @protected
     */
    protected async syncCrossExchangePairsStates(): Promise<void> {
        try {
            const crossPairs = this.data.crossPairs.slice()

            const promises = crossPairs.map(pair => (
                ton.getFullContractState({
                    address: pair.address!,
                })
            ))

            const states = await Promise.all(promises)

            states.forEach(({ state }, idx) => {
                crossPairs[idx] = { ...crossPairs[idx], state }
            })

            this.changeData('crossPairs', crossPairs)
        }
        catch (e) {
            error('Sync cross exchange pairs states error', e)
        }
    }

    /**
     * Load pairs for each selected token.
     * Filter by TVl value which greater or equal $100000.
     * @protected
     */
    protected async loadCrossPairs(): Promise<PairsResponse[] | undefined> {
        if (this.leftToken === undefined || this.rightToken === undefined) {
            return undefined
        }

        const request = (fromCurrencyAddress: string) => fetch(`${API_URL}/pairs/cross_pairs`, {
            body: JSON.stringify({
                fromCurrencyAddress,
                toCurrencyAddresses: CROSS_PAIR_EXCHANGE_WHITE_LIST,
            } as CrossPairsRequest),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'POST',
            mode: 'cors',
        })

        try {
            return await Promise.all([
                request(this.leftToken.root).then(response => response.json()),
                request(this.rightToken.root).then(response => response.json()),
            ])
        }
        catch (e) {
            error('Load selected tokens cross-pairs error', e)
            return undefined
        }
    }

    /**
     * Reset cross-pair exchange `data` to default values.
     * @protected
     */
    protected resetCrossExchangeData(): void {
        this.changeData('bestCrossExchangeRoute', undefined)
        this.changeData('crossPairs', [])
        this.changeData('routes', [])
    }

    /**
     * Invalidate cross-pair exchange.
     * @protected
     */
    protected invalidateCrossExchangeRoutes(): void {
        this.changeData(
            'routes',
            this.routes.map(route => ({
                ...route,
                bill: {},
                leftAmount: '',
                pairs: [],
                rightAmount: '',
                slippage: '',
                steps: [],
            })),
        )
    }


    /*
     * Computed states and values
     * ----------------------------------------------------------------------------------
     */

    /**
     * Returns `true` if left amount value is valid, otherwise `false`.
     */
    public get isLeftAmountValid(): boolean {
        return isAmountValid(this.leftAmountNumber, this.leftTokenDecimals)
    }

    /**
     * Returns `true` if right amount value is valid, otherwise `false`.
     */
    public get isRightAmountValid(): boolean {
        return isAmountValid(this.rightAmountNumber, this.rightTokenDecimals)
    }

    /**
     * Returns `true` if cross-pair exchange is available for current pair.
     * @returns {boolean}
     */
    public get isCrossExchangeAvailable(): boolean {
        return this.routes.length > 0
    }

    /**
     * Returns `true` if cross-pair swap exchange mode is enabled.
     * @returns {boolean}
     */
    public get isCrossExchangeMode(): boolean {
        return this.exchangeMode === SwapExchangeMode.CROSS_PAIR_EXCHANGE
    }

    /**
     * Returns `true` if all data and bill is valid, otherwise `false`.
     * @returns {boolean}
     */
    public get isCrossExchangeSwapValid(): boolean {
        return (
            this.isCrossExchangeAvailable
            && this.leftToken?.wallet !== undefined
            && this.data.bestCrossExchangeRoute?.bill !== undefined
            && this.data.bestCrossExchangeRoute.bill.amount !== undefined
            && new BigNumber(this.data.bestCrossExchangeRoute.bill.expectedAmount || 0).gt(0)
            && new BigNumber(this.data.bestCrossExchangeRoute.bill.amount || 0).gt(0)
            && new BigNumber(this.leftToken.balance || 0).gte(this.data.bestCrossExchangeRoute.bill.amount)
        )
    }

    /**
     * Returns `true` if all data and bill is valid, otherwise `false`.
     * @returns {boolean}
     */
    public get isDirectSwapValid(): boolean {
        return (
            this.isEnoughLiquidity
            && this.pair?.address !== undefined
            && this.leftToken?.wallet !== undefined
            && this.bill.amount !== undefined
            && new BigNumber(this.bill.expectedAmount || 0).gt(0)
            && new BigNumber(this.bill.amount || 0).gt(0)
            && new BigNumber(this.leftToken.balance || 0).gte(this.bill.amount)
        )
    }

    /**
     * Combined `isLoading` state.
     * @returns {boolean}
     */
    public get isLoading(): boolean {
        return (
            this.isCalculating
            || this.isCrossExchangeCalculating
            || this.isPairChecking
        )
    }

    /**
     * Returns `true` if selected tokens is inverted to the exists pair.
     * @protected
     */
    protected get isPairInverted(): boolean {
        return this.pair?.roots?.left.toString() !== this.leftToken?.root
    }

    /**
     * Returns memoized left token decimals or global default decimals - 18.
     * @returns {boolean}
     */
    public get leftTokenDecimals(): number {
        return this.leftToken?.decimals || DEFAULT_DECIMALS
    }

    /**
     * Returns memoized right token decimals or global default decimals - 18.
     * @returns {boolean}
     */
    public get rightTokenDecimals(): number {
        return this.rightToken?.decimals || DEFAULT_DECIMALS
    }

    /**
     *
     * @protected
     */
    protected get pairLeftBalanceNumber(): BigNumber {
        return new BigNumber(this.pair?.balances?.left || '0')
    }

    /**
     *
     * @protected
     */
    protected get pairRightBalanceNumber(): BigNumber {
        return new BigNumber(this.pair?.balances?.right || '0')
    }

    /**
     *
     * @protected
     */
    protected get leftAmountNumber(): BigNumber {
        return new BigNumber(this.leftAmount)
    }

    /**
     *
     * @protected
     */
    protected get rightAmountNumber(): BigNumber {
        return new BigNumber(this.rightAmount)
    }

    /**
     *
     * @protected
     */
    protected get leftTokenAddress(): Address | undefined {
        return this.leftToken?.root !== undefined ? new Address(this.leftToken?.root) : undefined
    }

    /**
     *
     * @protected
     */
    protected get rightTokenAddress(): Address | undefined {
        return this.rightToken?.root !== undefined ? new Address(this.rightToken?.root) : undefined
    }


    /*
     * Memoized cross-pair exchange data
     */

    /**
     * Cross exchange left amount
     * @returns {SwapRoute['leftAmount']}
     */
    public get crossExchangeLeftAmount(): SwapRoute['leftAmount'] {
        return this.bestCrossExchangeRoute?.leftAmount || ''
    }

    /**
     * Cross exchange right amount
     * @returns {SwapRoute['rightAmount']}
     */
    public get crossExchangeRightAmount(): SwapRoute['rightAmount'] {
        return this.bestCrossExchangeRoute?.rightAmount || ''
    }

    /**
     * Returns computed  cross-exchange swap slippage.
     */
    public get crossExchangeSlippage(): SwapRoute['slippage'] {
        if (this.bestCrossExchangeRoute?.slippage === undefined) {
            return undefined
        }
        return getCrossExchangeSlippage(
            this.data.slippage,
            this.bestCrossExchangeRoute.steps.length,
        )
    }


    /*
     * Computed bill data
     * ----------------------------------------------------------------------------------
     */

    /**
     * Bill: fee
     * @returns {SwapBill['fee']}
     */
    public get fee(): SwapBill['fee'] {
        return this.isCrossExchangeMode
            ? this.bestCrossExchangeRoute?.bill.fee
            : this.bill.fee
    }

    /**
     * Bill: min expected amount
     * @returns {SwapBill['minExpectedAmount']}
     */
    public get minExpectedAmount(): SwapBill['minExpectedAmount'] {
        return this.isCrossExchangeMode
            ? this.bestCrossExchangeRoute?.bill.minExpectedAmount
            : this.bill.minExpectedAmount
    }

    /**
     * Bill: price impact
     * @returns {SwapBill['priceImpact']}
     */
    public get priceImpact(): SwapBill['priceImpact'] {
        return this.isCrossExchangeMode
            ? this.bestCrossExchangeRoute?.bill.priceImpact
            : this.bill.priceImpact
    }


    /*
     * Computed store data values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @returns {SwapStoreData['priceLeftToRight']}
     */
    public get priceLeftToRight(): SwapStoreData['priceLeftToRight'] {
        return this.isCrossExchangeMode
            ? this.bestCrossExchangeRoute?.priceLeftToRight
            : this.data.priceLeftToRight
    }

    /**
     *
     * @returns {SwapStoreData['priceRightToLeft']}
     */
    public get priceRightToLeft(): SwapStoreData['priceRightToLeft'] {
        return this.isCrossExchangeMode
            ? this.bestCrossExchangeRoute?.priceRightToLeft
            : this.data.priceRightToLeft
    }


    /*
     * Memoized store data values
     * ----------------------------------------------------------------------------------
     */

    /**
     * @returns {SwapStoreData['bestCrossExchangeRoute']}
     */
    public get bestCrossExchangeRoute(): SwapStoreData['bestCrossExchangeRoute'] {
        return this.data.bestCrossExchangeRoute
    }

    /**
     * Returns memoized left amount value
     * @returns {SwapStoreData['leftAmount']}
     */
    public get leftAmount(): SwapStoreData['leftAmount'] {
        return this.data.leftAmount
    }

    /**
     * Returns memoized left selected token
     * @returns {TokenCache | undefined}
     */
    public get leftToken(): TokenCache | undefined {
        return this.data.leftToken !== undefined ? this.tokensCache.get(this.data.leftToken) : undefined
    }

    /**
     * Returns memoized current direct pair
     * @returns {SwapStoreData['pair']}
     */
    public get pair(): SwapStoreData['pair'] {
        return this.data.pair
    }

    /**
     * Returns memoized list of the possible cross-tokens
     * @returns {SwapStoreData['routes']}
     */
    public get routes(): SwapStoreData['routes'] {
        return this.data.routes
    }

    /**
     * Returns memoized right amount value
     * @returns {SwapStoreData['rightAmount']}
     */
    public get rightAmount(): SwapStoreData['rightAmount'] {
        return this.data.rightAmount
    }

    /**
     * Returns memoized right selected token
     * @returns {TokenCache | undefined}
     */
    public get rightToken(): TokenCache | undefined {
        return this.data.rightToken !== undefined ? this.tokensCache.get(this.data.rightToken) : undefined
    }

    /**
     * Returns memoized slippage tolerance value
     * @returns {SwapStoreData['slippage']}
     */
    public get slippage(): SwapStoreData['slippage'] {
        return this.data.slippage
    }

    /**
     * Returns memoized swap direction
     * @returns {SwapStoreState['direction']}
     */
    public get direction(): SwapStoreState['direction'] {
        return this.state.direction
    }

    /*
     * Memoized store state values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @returns {SwapStoreState['exchangeMode']}
     */
    public get exchangeMode(): SwapStoreState['exchangeMode'] {
        return this.state.exchangeMode
    }

    /**
     *
     * @returns {SwapStoreState['isCalculating']}
     */
    public get isCalculating(): SwapStoreState['isCalculating'] {
        return this.state.isCalculating
    }

    /**
     *
     * @returns {SwapStoreState['isCrossExchangeCalculating']}
     */
    public get isCrossExchangeCalculating(): SwapStoreState['isCrossExchangeCalculating'] {
        return this.state.isCrossExchangeCalculating
    }

    /**
     *
     * @returns {SwapStoreState['isCrossExchangePreparing']}
     */
    public get isCrossExchangePreparing(): SwapStoreState['isCrossExchangePreparing'] {
        return this.state.isCrossExchangePreparing
    }

    /**
     *
     * @returns {SwapStoreState['isEnoughLiquidity']}
     */
    public get isEnoughLiquidity(): SwapStoreState['isEnoughLiquidity'] {
        return this.state.isEnoughLiquidity
    }

    /**
     *
     * @returns {SwapStoreState['isConfirmationAwait']}
     */
    public get isConfirmationAwait(): SwapStoreState['isConfirmationAwait'] {
        return this.state.isConfirmationAwait
    }

    /**
     *
     * @returns {SwapStoreState['isPairChecking']}
     */
    public get isPairChecking(): SwapStoreState['isPairChecking'] {
        return this.state.isPairChecking
    }

    /**
     *
     * @returns {SwapStoreState['isSwapping']}
     */
    public get isSwapping(): SwapStoreState['isSwapping'] {
        return this.state.isSwapping
    }

    /**
     *
     * @returns {SwapStoreState['priceDirection']}
     */
    public get priceDirection(): SwapStoreState['priceDirection'] {
        return this.state.priceDirection
    }

    /**
     * Returns swap transaction receipt shape
     * @returns {SwapTransactionReceipt | undefined}
     */
    public get transaction(): SwapTransactionReceipt | undefined {
        return this.transactionReceipt
    }

    /**
     * Internal swap transaction subscriber
     * @type {Subscriber}
     * @protected
     */
    #transactionSubscriber: Subscriber | undefined

    #pairUpdatesUpdater: ReturnType<typeof setInterval> | undefined

    /*
     * Internal reaction disposers
     * ----------------------------------------------------------------------------------
     */

    #slippageDisposer: IReactionDisposer | undefined

    #tokensDisposer: IReactionDisposer | undefined

    #walletAccountDisposer: IReactionDisposer | undefined

}


const SwapStoreSingleton = new SwapStore(useWallet(), useTokensCache())

export function useSwapStore(): SwapStore {
    return SwapStoreSingleton
}
