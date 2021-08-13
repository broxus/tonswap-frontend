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
    DEFAULT_SWAP_BILL,
    DEFAULT_SWAP_STORE_DATA,
    DEFAULT_SWAP_STORE_STATE,
} from '@/modules/Swap/constants'
import {
    SwapBill,
    SwapDirection,
    SwapFailureResult,
    SwapStoreData,
    SwapStoreState,
    SwapSuccessResult,
    SwapTransactionReceipt,
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
     * @type {SwapTransactionReceipt | undefined}
     * @protected
     */
    protected transactionReceipt: SwapTransactionReceipt | undefined = undefined

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
        if (key === 'rightAmount') {
            this.changeState('direction', SwapDirection.RTL)
        }
        else if (key === 'leftAmount') {
            this.changeState('direction', SwapDirection.LTR)
        }

        if (
            ['leftAmount', 'rightAmount'].includes(key)
            && (value as string).length === 0
        ) {
            this.data.leftAmount = ''
            this.data.rightAmount = ''
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
        await this.unsubscribeTransactionSubscriber()

        this.#transactionSubscriber = new Subscriber(ton)

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

        try {
            await this.handleTokensChange([
                this.leftToken as TokenCache,
                this.rightToken as TokenCache,
            ])
            await this.handleAmountsChange()
        }
        catch (e) {}
    }

    /**
     * Manually dispose all of the internal subscribers.
     * Clean last transaction result, reset all data to their defaults.
     */
    public async dispose(): Promise<void> {
        await this.unsubscribeTransactionSubscriber()
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
            this.changeState('isSwapping', false)
            return
        }

        const deployGrams = this.rightToken?.balance !== undefined ? '0' : '100000000'

        const pairWallet = await TokenWallet.walletAddress({
            root: new Address(this.leftToken?.root),
            owner: this.pair.address,
        })

        const processingId = new BigNumber(
            Math.floor(
                Math.random() * (Number.MAX_SAFE_INTEGER - 1),
            ) + 1,
        ).toFixed()

        const {
            value0: payload,
        } = await this.pairContract?.methods.buildExchangePayload({
            id: processingId,
            expected_amount: this.minExpectedAmount,
            deploy_wallet_grams: deployGrams,
        }).call()

        this.changeState('isLoading', true)
        this.changeState('isSwapping', true)

        const owner = new Contract(DexAbi.Callbacks, new Address(this.wallet.address))

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
        catch (e) {
            error('decodeTransaction error: ', e)
            this.changeState('isSwapping', false)
            this.changeState('isLoading', false)
        }
    }

    /**
     * Manually clean last transaction result
     */
    public cleanTransactionResult(): void {
        this.transactionReceipt = undefined
    }

    /**
     * Manually revert tokens direction
     */
    public toggleTokensDirection(): void {
        if (this.isLoading || this.isSwapping) {
            return
        }

        const {
            leftAmount,
            rightAmount,
            leftToken,
            rightToken,
        } = this

        this.data.leftAmount = rightAmount
        this.data.rightAmount = leftAmount

        this.data.leftToken = rightToken
        this.data.rightToken = leftToken

        if (this.direction === SwapDirection.LTR) {
            this.changeState('direction', SwapDirection.RTL)
        }
        else if (this.direction === SwapDirection.RTL) {
            this.changeState('direction', SwapDirection.LTR)
        }

        this.resetBill()
    }

    /**
     * Manually revert price direction
     */
    public togglePriceDirection(): void {
        this.changeState('priceDirection', this.priceDirection === SwapDirection.LTR
            ? SwapDirection.RTL
            : SwapDirection.LTR)
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
            || !this.pair
            || (this.direction === SwapDirection.LTR && prevRightAmount !== rightAmount)
            || (this.direction === SwapDirection.RTL && prevLeftAmount !== leftAmount)
        ) {
            return
        }

        this.resetBill()

        if (this.pair.address) {
            this.changeState('isEnoughLiquidity', true)
            this.changeState('isLoading', true)

            try {
                await this.syncPairData()
            }
            catch (e) {
                error('Sync pair data error', e)
            }

            const leftBalance = this.pair.balances?.left || '0'
            const rightBalance = this.pair.balances?.right || '0'

            let leftBN = new BigNumber(leftBalance),
                rightBN = new BigNumber(rightBalance)

            if (!(this.pair.roots?.left.toString() === this.leftToken?.root)) {
                const left = leftBN
                leftBN = rightBN
                rightBN = left
            }

            this.changeState('isEnoughLiquidity', !leftBN.isZero() && !rightBN.isZero())

            const leftDecimals = this.leftToken?.decimals || DEFAULT_DECIMALS
            const rightDecimals = this.rightToken?.decimals || DEFAULT_DECIMALS

            if (this.isEnoughLiquidity && this.direction === SwapDirection.RTL) {
                if (this.isRightAmountValid) {
                    const amount = new BigNumber(this.rightAmount || '0').shiftedBy(rightDecimals)

                    this.changeState('isEnoughLiquidity', amount.lt(rightBN))

                    if (!this.isEnoughLiquidity) {
                        runInAction(() => {
                            this.data.leftAmount = ''
                        })
                    }
                }
            }

            if (this.isEnoughLiquidity) {
                this.changeData('priceLeftToRight', getComputedDefaultPerPrice(
                    leftBN,
                    leftDecimals,
                    rightBN.shiftedBy(-rightDecimals),
                    leftDecimals,
                ))
                this.changeData('priceRightToLeft', getComputedDefaultPerPrice(
                    rightBN,
                    rightDecimals,
                    leftBN.shiftedBy(-leftDecimals),
                    rightDecimals,
                ))

                const leftDecimalsM = new BigNumber(10).pow(this.leftToken?.decimals || 0).toFixed()
                const rightDecimalsM = new BigNumber(10).pow(this.rightToken?.decimals || 0).toFixed()

                if (
                    (
                        this.direction === SwapDirection.RTL
                        || (this.leftAmount.length === 0 && this.direction !== SwapDirection.LTR)
                    )
                    && this.isRightAmountValid
                    && this.rightToken?.root
                ) {
                    runInAction(() => {
                        this.bill.expectedAmount = (
                            new BigNumber(this.rightAmount)
                                .times(rightDecimalsM)
                                .dp(0, BigNumber.ROUND_DOWN)
                                .toFixed()
                        )

                        this.bill.minExpectedAmount = (
                            new BigNumber(this.expectedAmount || '0')
                                .div(100)
                                .times(new BigNumber(100).minus(this.slippage))
                                .dp(0, BigNumber.ROUND_DOWN)
                                .toFixed()
                        )
                    })

                    if (this.pairContract !== undefined) {
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
                            .toFixed()

                        const newAPool = new BigNumber(aPool)
                            .times(bPool)
                            .div(newBPool)
                            .dp(0, BigNumber.ROUND_DOWN)
                            .toFixed()

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
                                this.data.leftAmount = ''
                                this.data.rightAmount = ''
                            })
                        }
                        else {
                            runInAction(() => {
                                this.bill.amount = expectedAmount.toFixed()
                                this.bill.fee = expectedFee.toFixed()
                                this.data.leftAmount = expectedAmount.div(leftDecimalsM).toFixed()
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
                        this.bill.amount = new BigNumber(this.leftAmount || '0')
                            .times(leftDecimalsM)
                            .dp(0, BigNumber.ROUND_DOWN)
                            .toFixed()
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
                            this.bill.fee = expectedFee
                            this.bill.expectedAmount = expectedAmount
                            this.bill.minExpectedAmount = (
                                new BigNumber(this.expectedAmount || '0')
                                    .div(100)
                                    .times(new BigNumber(100).minus(this.slippage))
                                    .dp(0, BigNumber.ROUND_DOWN)
                                    .toFixed()
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
                                this.data.rightAmount = newRight.toFixed()
                            })
                        }
                        else {
                            runInAction(() => {
                                this.data.rightAmount = ''
                            })
                        }
                    }
                }

                if (this.isRightAmountValid) {
                    if (this.amount && this.expectedAmount && this.pairContract) {
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
                            this.changeData('priceLeftToRight', priceLeftToRight.toFixed())
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
                            this.changeData('priceRightToLeft', priceRightToLeft.toFixed())
                        }

                        const {
                            numerator,
                            denominator,
                        } = await this.pairContract.methods.getFeeParams({
                            _answer_id: 0,
                        }).call()

                        if (this.pair.roots?.left?.toString() === this.leftToken?.root) {
                            runInAction(() => {
                                this.bill.priceImpact = getComputedPriceImpact(
                                    new BigNumber(rightBalance)
                                        .div(leftBalance)
                                        .times(
                                            new BigNumber(this.amount || '0')
                                                // @ts-ignore
                                                .times(denominator - numerator)
                                                .div(denominator),
                                        ),
                                    new BigNumber(this.expectedAmount || '0'),
                                )
                            })
                        }
                        else {
                            runInAction(() => {
                                this.bill.priceImpact = getComputedPriceImpact(
                                    new BigNumber(leftBalance)
                                        .div(rightBalance)
                                        .times(
                                            new BigNumber(this.amount || '0')
                                                // @ts-ignore
                                                .times(denominator - numerator)
                                                .div(denominator),
                                        ),
                                    new BigNumber(this.expectedAmount || '0'),
                                )
                            })
                        }
                    }
                }
            }
            else {
                this.changeData('priceLeftToRight', undefined)
                this.changeData('priceRightToLeft', undefined)
            }
        }
        else {
            this.changeData('priceLeftToRight', undefined)
            this.changeData('priceRightToLeft', undefined)
        }

        this.changeData('priceDecimalsLeft', this.leftToken?.decimals)
        this.changeData('priceDecimalsRight', this.rightToken?.decimals)
        this.changeState('isValid', (
            this.isEnoughLiquidity
            && this.pair.address !== undefined
            && this.amount !== undefined
            && this.leftToken?.wallet !== undefined
            && new BigNumber(this.expectedAmount || 0).gt(0)
            && new BigNumber(this.amount || 0).gt(0)
            && new BigNumber(this.leftToken?.balance || 0).gte(this.amount)
        ))
        this.changeState('isLoading', false)
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
            this.changeData('slippage', '0.5')
        }
        else {
            this.changeData('slippage', val.toFixed())
        }

        if (this.expectedAmount) {
            this.bill.minExpectedAmount = new BigNumber(this.expectedAmount)
                .div(100)
                .times(new BigNumber(100).minus(this.slippage))
                .dp(0, BigNumber.ROUND_DOWN)
                .toFixed()
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
                this.data.rightToken = undefined
                this.data.rightAmount = leftAmount
                this.data.leftAmount = ''
            }
            else if (isRightChanged) {
                const { rightAmount } = this
                this.data.leftToken = undefined
                this.data.leftAmount = rightAmount
                this.data.rightAmount = ''
            }
        }

        if ((isLeftChanged || isRightChanged) && !isToggleDirection) {
            this.changeData('pair', undefined)
            this.changeState('pairExist', false)
        }

        if (!leftToken?.root || !rightToken?.root) {
            this.changeData('pair', undefined)
            this.changeState('pairExist', false)
            return
        }

        if (!this.pair) {
            this.changeState('isLoading', true)

            try {
                const pair = await checkPair(leftToken?.root, rightToken?.root)
                this.changeData('pair', { address: pair })
                this.changeState('pairExist', pair !== undefined)
                this.changeState('isLoading', false)
            }
            catch (e) {
                this.changeData('pair', undefined)
                this.changeState('pairExist', false)
                this.changeState('isLoading', false)
            }
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
        this.transactionReceipt = {
            hash: transaction.id.hash,
            receivedAmount: input.result.received.toString(),
            receivedDecimals: this.rightToken?.decimals,
            receivedIcon: this.rightToken?.icon,
            receivedRoot: this.rightToken?.root,
            receivedSymbol: this.rightToken?.symbol,
            spentAmount: input.result.spent.toString(),
            spentDecimals: this.leftToken?.decimals,
            spentFee: input.result.fee.toString(),
            spentSymbol: this.leftToken?.symbol,
            success: true,
        }

        this.changeState('isSwapping', false)
        this.changeState('isLoading', false)
        this.changeState('isValid', false)

        this.data.leftAmount = ''
        this.data.rightAmount = ''
    }

    /**
     * Failure transaction callback handler
     * @param {SwapFailureResult} [_]
     * @protected
     */
    protected handleSwapFailure(_?: SwapFailureResult): void {
        this.transactionReceipt = {
            success: false,
        }

        this.changeState('isSwapping', false)
        this.changeState('isLoading', false)
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
            leftToken: this.leftToken,
            rightToken: this.rightToken,
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

        const [
            { left_balance: leftBalance },
            { right_balance: rightBalance },
            { left: leftRoot, right: rightRoot },
        ] = await Promise.all([
            this.pairContract.methods.left_balance({}).call(),
            this.pairContract.methods.right_balance({}).call(),
            this.pairContract.methods.getTokenRoots({
                _answer_id: 0,
            }).call(),
        ])

        this.changeData('pair', {
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
    }

    /*
     * Memoized bill values
     * ----------------------------------------------------------------------------------
     */

    /**
     * Bill: amount
     * @returns {SwapBill['amount']}
     */
    public get amount(): SwapBill['amount'] {
        return this.bill.amount
    }

    /**
     * Bill: expected amount
     * @returns {SwapBill['expectedAmount']}
     */
    public get expectedAmount(): SwapBill['expectedAmount'] {
        return this.bill.expectedAmount
    }

    /**
     * Bill: fee
     * @returns {SwapBill['fee']}
     */
    public get fee(): SwapBill['fee'] {
        return this.bill.fee
    }

    /**
     * Bill: min expected amount
     * @returns {SwapBill['minExpectedAmount']}
     */
    public get minExpectedAmount(): SwapBill['minExpectedAmount'] {
        return this.bill.minExpectedAmount
    }

    /**
     * Bill: price impact
     * @returns {SwapBill['priceImpact']}
     */
    public get priceImpact(): SwapBill['priceImpact'] {
        return this.bill.priceImpact
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
     * Left amount value
     * @returns {SwapStoreData['leftAmount']}
     */
    public get leftAmount(): SwapStoreData['leftAmount'] {
        return this.data.leftAmount
    }

    /**
     * Selected left token
     * @returns {SwapStoreData['leftToken]}
     */
    public get leftToken(): SwapStoreData['leftToken'] {
        return this.data.leftToken
    }

    /**
     *
     * @returns {SwapStoreData['pair']}
     */
    public get pair(): SwapStoreData['pair'] {
        return this.data.pair
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
     * @returns {SwapStoreData['priceDecimalsLeft']}
     */
    public get priceDecimalsLeft(): SwapStoreData['priceDecimalsLeft'] {
        return this.data.priceDecimalsLeft
    }

    /**
     *
     * @returns {SwapStoreData['priceDecimalsRight']}
     */
    public get priceDecimalsRight(): SwapStoreData['priceDecimalsRight'] {
        return this.data.priceDecimalsRight
    }

    /**
     *
     * @returns {SwapStoreData['priceLeftToRight']}
     */
    public get priceLeftToRight(): SwapStoreData['priceLeftToRight'] {
        return this.data.priceLeftToRight
    }

    /**
     *
     * @returns {SwapStoreData['priceRightToLeft']}
     */
    public get priceRightToLeft(): SwapStoreData['priceRightToLeft'] {
        return this.data.priceRightToLeft
    }

    /**
     *
     * @returns {SwapStoreData['rightAmount']}
     */
    public get rightAmount(): SwapStoreData['rightAmount'] {
        return this.data.rightAmount
    }

    /**
     *
     * @returns {SwapStoreData['rightToken']}
     */
    public get rightToken(): SwapStoreData['rightToken'] {
        return this.data.rightToken
    }

    /**
     *
     * @returns {SwapStoreData['slippage']}
     */
    public get slippage(): SwapStoreData['slippage'] {
        return this.data.slippage
    }

    /**
     *
     * @returns {SwapStoreState['direction']}
     */
    public get direction(): SwapStoreState['direction'] {
        return this.state.direction
    }

    /**
     *
     * @returns {SwapStoreState['isEnoughLiquidity']}
     */
    public get isEnoughLiquidity(): SwapStoreState['isEnoughLiquidity'] {
        return this.state.isEnoughLiquidity
    }

    /*
     * Memoized store state values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @returns {SwapStoreState['isLoading']}
     */
    public get isLoading(): SwapStoreState['isLoading'] {
        return this.state.isLoading
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
     * @returns {SwapStoreState['isValid']}
     */
    public get isValid(): SwapStoreState['isValid'] {
        return this.state.isValid
    }

    /**
     *
     * @returns {SwapStoreState['pairExist']}
     */
    public get pairExist(): SwapStoreState['pairExist'] {
        return this.state.pairExist
    }

    /**
     *
     * @returns {SwapStoreState['priceDirection']}
     */
    public get priceDirection(): SwapStoreState['priceDirection'] {
        return this.state.priceDirection
    }

    /**
     *
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

    /*
     * Internal reaction disposers
     * ----------------------------------------------------------------------------------
     */

    #amountsDisposer: IReactionDisposer | undefined

    #slippageDisposer: IReactionDisposer | undefined

    #tokensDisposer: IReactionDisposer | undefined

    #walletAccountDisposer: IReactionDisposer | undefined

}


const SwapStoreSingleton = new SwapStore()

export function useSwapStore(): SwapStore {
    return SwapStoreSingleton
}
