import BigNumber from 'bignumber.js'
import {
    IReactionDisposer,
    action,
    makeAutoObservable,
    reaction,
    runInAction,
    toJS,
} from 'mobx'
import { Address, Contract } from 'ton-inpage-provider'

import { DexAbi } from '@/misc/abi'
import { checkPair } from '@/misc/helpers'
import { TokenWallet } from '@/misc/token-wallet'
import {
    DEFAULT_LEFT_TOKEN_ROOT,
    DEFAULT_RIGHT_TOKEN_ROOT,
} from '@/modules/Swap/constants'
import {
    TokenCache,
    TokensCacheService,
    useTokensCache,
} from '@/stores/TokensCacheService'
import { TokensListService, useTokensList } from '@/stores/TokensListService'
import { WalletData, WalletService, useWallet } from '@/stores/WalletService'
import { error, log } from '@/utils'


export type PropertyKey<T> = keyof T & string

export enum SwapDirection {
    LTR = 'ltr',
    RTL = 'rtl',
}

export enum SwapPriceDirection {
    LTR = 'ltr',
    RTL = 'rtl',
}

export type SwapBill = {
    amount?: string;
    expectedAmount?: string;
    fee?: string;
    minExpectedAmount?: string;
    priceImpact?: string;
}

export type SwapData = {
    leftAmount?: string;
    leftToken?: TokenCache;
    priceDecimalsLeft?: number;
    priceDecimalsRight?: number;
    priceLeftToRight?: string;
    priceRightToLeft?: string;
    rightAmount?: string;
    rightToken?: TokenCache;
    slippage: string;
}

export type SwapState = {
    direction: SwapDirection;
    isEnoughLiquidity: boolean;
    isLoading: boolean;
    isSwapping: boolean;
    isValid: boolean;
    pair?: Address;
    pairExist: boolean;
    priceDirection?: SwapPriceDirection;
    processingId?: string;
}

export type SwapTransactionResult = {
    receivedAmount?: string;
    receivedDecimals?: number;
    receivedIcon?: string;
    receivedRoot?: string;
    receivedSymbol?: string;
    spentAmount?: string;
    spentDecimals?: number;
    spentFee?: string;
    spentSymbol?: string;
    success: boolean;
    transactionHash?: string;
}


function getComputedPriceImpact(
    start: BigNumber.Value,
    end: BigNumber,
): string {
    return end.minus(start)
        .div(start)
        .abs()
        .times(100)
        .dp(2, BigNumber.ROUND_UP)
        .toString()
}

function getComputedDefaultPerPrice(
    value: BigNumber,
    shiftedBy: number,
    dividedBy: BigNumber.Value,
    decimalPlaces: number,
): string {
    return value
        .shiftedBy(-shiftedBy)
        .dividedBy(dividedBy)
        .decimalPlaces(decimalPlaces, BigNumber.ROUND_UP)
        .shiftedBy(shiftedBy)
        .toFixed()
}

function getComputedNoRightAmountPerPrice(
    value: BigNumber.Value,
    divided: BigNumber.Value,
    times: BigNumber.Value,
): BigNumber {
    return new BigNumber(value)
        .div(divided)
        .times(new BigNumber(10).pow(times))
        .dp(0, BigNumber.ROUND_DOWN)
}

const DEFAULT_SWAP_BILL: SwapBill = {
    amount: undefined,
    expectedAmount: undefined,
    fee: undefined,
    minExpectedAmount: undefined,
    priceImpact: undefined,
}

const DEFAULT_SWAP_DATA: SwapData = {
    leftAmount: '',
    leftToken: undefined,
    priceDecimalsLeft: undefined,
    priceDecimalsRight: undefined,
    priceLeftToRight: undefined,
    priceRightToLeft: undefined,
    rightAmount: '',
    rightToken: undefined,
    slippage: '0.5',
}

const DEFAULT_SWAP_STATE: SwapState = {
    direction: SwapDirection.LTR,
    isEnoughLiquidity: true,
    isLoading: false,
    isSwapping: false,
    isValid: false,
    pairExist: true,
    priceDirection: SwapPriceDirection.LTR,
}


export class SwapStore {

    /**
     *
     * @protected
     */
    protected bill: SwapBill = DEFAULT_SWAP_BILL

    /**
     *
     * @protected
     */
    protected data: SwapData = DEFAULT_SWAP_DATA

    /**
     *
     * @protected
     */
    protected state: SwapState = DEFAULT_SWAP_STATE

    /**
     *
     * @protected
     */
    protected transactionResult: SwapTransactionResult | undefined = undefined

    constructor(
        protected readonly wallet: WalletService = useWallet(),
        protected readonly tokensCache: TokensCacheService = useTokensCache(),
        protected readonly tokensList: TokensListService = useTokensList(),
    ) {
        makeAutoObservable<
            SwapStore,
            | 'handleAmountChange'
            | 'handleLeftTokenChange'
            | 'handleRightTokenChange'
            | 'handleSlippageChange'
            | 'handleTransactionResult'
        >(this, {
            changeData: action.bound,
            toggleTokensDirection: action.bound,
            handleAmountChange: action.bound,
            handleLeftTokenChange: action.bound,
            handleRightTokenChange: action.bound,
            handleSlippageChange: action.bound,
            handleTransactionResult: action.bound,
        })

        reaction(() => this.tokensCache.tokens, () => {
            if (!this.data.leftToken || this.data.leftToken.root === DEFAULT_LEFT_TOKEN_ROOT) {
                this.data.leftToken = this.tokensCache.get(DEFAULT_LEFT_TOKEN_ROOT)
            }

            if (!this.data.rightToken || this.data.rightToken.root === DEFAULT_RIGHT_TOKEN_ROOT) {
                this.data.rightToken = this.tokensCache.get(DEFAULT_RIGHT_TOKEN_ROOT)
            }
        })
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Manually change data by the given key
     * @template K
     * @param {K} key
     * @param {SwapData[K]} value
     */
    public changeData<
        K extends PropertyKey<SwapData>
    >(key: K, value: SwapData[K]): void {
        this.data[key] = value

        if (key === 'rightAmount' && this.state.direction !== SwapDirection.RTL) {
            this.state.direction = SwapDirection.RTL
        }
        else if (key === 'leftAmount' && this.state.direction !== SwapDirection.LTR) {
            this.state.direction = SwapDirection.LTR
        }
    }

    /**
     *
     */
    public toggleTokensDirection(): void {
        if (this.isLoading) {
            return
        }

        const leftToken = this.leftToken ? { ...this.leftToken } : undefined
        this.data.leftToken = this.rightToken ? { ...this.rightToken } : undefined
        this.data.rightToken = leftToken
    }

    /**
     *
     */
    public togglePriceDirection(): void {
        this.state.priceDirection = this.priceDirection === SwapPriceDirection.LTR
            ? SwapPriceDirection.RTL
            : SwapPriceDirection.LTR
    }

    /**
     *
     */
    public async swap(): Promise<void> {
        if (
            !this.isValid
            || !this.pair
            || !this.leftToken?.root
            || !this.leftToken?.wallet
            || !this.amount
            || !this.wallet.address
            || !this.minExpectedAmount
        ) {
            this.state.isSwapping = false
            return
        }

        const deployGrams = this.rightToken?.wallet ? '50000000' : '0'

        const pairWallet = await TokenWallet.walletAddress({
            root: new Address(this.leftToken?.root),
            owner: this.pair,
        })

        const processingId = new BigNumber(
            Math.floor(
                Math.random() * (Number.MAX_SAFE_INTEGER - 1),
            ) + 1,
        ).toString()

        log('processingId', processingId)

        const {
            value0: payload,
        } = await new Contract(DexAbi.Pair, this.pair)
            .methods.buildExchangePayload({
                id: processingId,
                expected_amount: this.minExpectedAmount ?? '0',
                deploy_wallet_grams: deployGrams,
            })
            .call()

        runInAction(() => {
            this.state.isLoading = true
            this.state.isSwapping = true
            this.state.processingId = processingId
        })

        await TokenWallet.send({
            address: new Address(this.leftToken?.wallet),
            tokens: this.amount,
            owner: new Address(this.wallet.address),
            recipient: pairWallet,
            grams: '2000000000',
            payload,
        }).catch(err => {
            error('Sending error', err)
            runInAction(() => {
                this.state.isLoading = false
                this.state.isSwapping = false
                delete this.state.processingId
            })
        })
    }

    /**
     * @param {(string | undefined)[]} amounts
     * @param {(string | undefined)[]} prevAmounts
     * @protected
     */
    protected async handleAmountChange(
        amounts: (string | undefined)[] = [],
        prevAmounts: (string | undefined)[] = [],
    ): Promise<void> {
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

        delete this.bill.amount
        delete this.bill.expectedAmount
        delete this.bill.fee
        delete this.bill.minExpectedAmount
        delete this.bill.priceImpact

        this.state.isEnoughLiquidity = true
        this.state.isLoading = true

        const decimalsLeft = this.leftToken?.decimals ?? 18
        const decimalsRight = this.rightToken?.decimals ?? 18

        if (this.pair) {
            const pair = new Contract(DexAbi.Pair, this.pair)

            const {
                left_balance: leftBalance,
            } = await pair.methods.left_balance({}).call()
            const {
                right_balance: rightBalance,
            } = await pair.methods.right_balance({}).call()

            let leftBN = new BigNumber(leftBalance.toString()),
                rightBN = new BigNumber(rightBalance.toString())

            runInAction(() => {
                this.state.isEnoughLiquidity = !leftBN.isZero() && !rightBN.isZero()
            })

            const { left } = await pair.methods.getTokenRoots({
                _answer_id: 0,
            }).call()
            const inverse = !(left.toString() === this.leftToken?.root)

            if (inverse) {
                const b = leftBN
                leftBN = rightBN
                rightBN = b
            }

            if (this.direction === SwapDirection.RTL && this.isEnoughLiquidity) {
                if (this.rightAmount) {
                    const amBN = new BigNumber(this.rightAmount).shiftedBy(decimalsRight)

                    runInAction(() => {
                        this.state.isEnoughLiquidity = amBN.lt(rightBN)
                    })

                    if (!this.isEnoughLiquidity) {
                        runInAction(() => {
                            this.data.leftAmount = ''
                        })
                    }
                }
            }

            if (this.isEnoughLiquidity) {
                runInAction(() => {
                    this.data.priceLeftToRight = getComputedDefaultPerPrice(
                        leftBN,
                        decimalsLeft,
                        rightBN.shiftedBy(-decimalsRight),
                        decimalsLeft,
                    )

                    this.data.priceRightToLeft = getComputedDefaultPerPrice(
                        rightBN,
                        decimalsRight,
                        leftBN.shiftedBy(-decimalsLeft),
                        decimalsRight,
                    )
                })

                const decimalsLeftM = new BigNumber(10).pow(decimalsLeft).toString()
                const decimalsRightM = new BigNumber(10).pow(decimalsRight).toString()

                if (
                    (
                        this.state.direction === SwapDirection.RTL
                        || (!this.leftAmount && this.state.direction !== SwapDirection.LTR)
                    )
                    && this.rightAmount
                    && this.rightToken?.root
                ) {
                    runInAction(() => {
                        this.bill.expectedAmount = new BigNumber(this.rightAmount ?? '0')
                            .times(decimalsRightM)
                            .dp(0, BigNumber.ROUND_DOWN)
                            .toString()

                        this.bill.minExpectedAmount = new BigNumber(this.expectedAmount ?? '0')
                            .div(100)
                            .times(new BigNumber(100).minus(this.slippage))
                            .dp(0, BigNumber.ROUND_DOWN)
                            .toString()
                    })

                    // TODO: replace this code with FIXME after upgrade DEX
                    // START
                    const {
                        numerator,
                        denominator,
                    } = await pair.methods.getFeeParams({
                        _answer_id: 0,
                    }).call()

                    const aPool = left.toString() === this.leftToken?.root ? leftBalance : rightBalance
                    const bPool = left.toString() === this.leftToken?.root ? rightBalance : leftBalance

                    const newBPool = new BigNumber(bPool)
                        .minus(this.expectedAmount ?? '0')
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

                    if (
                        expectedAmount.lte(0)
                        || expectedAmount.isNaN()
                        || !expectedAmount.isFinite()
                    ) {
                        runInAction(() => {
                            this.data.leftAmount = ''
                            this.data.rightAmount = ''
                        })
                    }
                    else {
                        runInAction(() => {
                            this.bill.fee = expectedFee.toString()
                            this.bill.amount = expectedAmount.toString()
                            this.data.leftAmount = expectedAmount.div(decimalsLeftM).toString()
                        })
                    }
                }
                else if (
                    this.state.direction !== SwapDirection.RTL
                    && this.leftAmount
                    && this.leftToken?.root
                ) {
                    runInAction(() => {
                        this.bill.amount = new BigNumber(this.leftAmount ?? '0')
                            .times(decimalsLeftM)
                            .dp(0, BigNumber.ROUND_DOWN)
                            .toString()
                    })

                    const {
                        expected_amount: expectedAmount,
                        expected_fee: expectedFee,
                    } = await pair.methods.expectedExchange({
                        _answer_id: 0,
                        amount: this.amount ?? '0',
                        spent_token_root: new Address(this.leftToken?.root),
                    }).call()

                    runInAction(() => {
                        this.bill.fee = expectedFee.toString()
                        this.bill.expectedAmount = expectedAmount.toString()
                        this.bill.minExpectedAmount = new BigNumber(this.expectedAmount ?? '0')
                            .div(100)
                            .times(new BigNumber(100).minus(this.slippage))
                            .dp(0, BigNumber.ROUND_DOWN)
                            .toString()
                    })

                    const newRight = new BigNumber(this.expectedAmount ?? '0')
                        .div(decimalsRightM)

                    if (
                        newRight.isFinite()
                        && newRight.isPositive()
                        && !newRight.isZero() && !newRight.isNaN()
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

                if (this.rightAmount) {
                    if (this.amount && this.expectedAmount) {
                        const priceLeftToRight = getComputedNoRightAmountPerPrice(
                            this.amount,
                            this.expectedAmount,
                            decimalsRight,
                        )

                        if (
                            priceLeftToRight.isFinite()
                            && !priceLeftToRight.isNaN()
                            && priceLeftToRight.gt(0)
                        ) {
                            runInAction(() => {
                                this.data.priceLeftToRight = priceLeftToRight.toString()
                            })
                        }

                        const priceRightToLeft = getComputedNoRightAmountPerPrice(
                            this.expectedAmount,
                            this.amount,
                            decimalsLeft,
                        )

                        if (
                            priceRightToLeft.isFinite()
                            && !priceRightToLeft.isNaN()
                            && priceRightToLeft.gt(0)
                        ) {
                            runInAction(() => {
                                this.data.priceRightToLeft = priceRightToLeft.toString()
                            })
                        }

                        if (left.toString() === this.leftToken?.root) {
                            const start = new BigNumber(leftBalance)
                                .div(rightBalance)

                            const end = new BigNumber(leftBalance)
                                .plus(this.amount)
                                .div(new BigNumber(rightBalance).minus(this.expectedAmount))

                            runInAction(() => {
                                this.bill.priceImpact = getComputedPriceImpact(start, end)
                            })
                        }
                        else {
                            const start = new BigNumber(rightBalance)
                                .div(leftBalance)

                            const end = new BigNumber(rightBalance)
                                .plus(this.amount)
                                .div(new BigNumber(leftBalance).minus(this.expectedAmount))

                            runInAction(() => {
                                this.bill.priceImpact = getComputedPriceImpact(start, end)
                            })
                        }
                    }
                }
            }
            else {
                runInAction(() => {
                    this.data.priceLeftToRight = undefined
                    this.data.priceRightToLeft = undefined
                })
            }
        }
        else {
            runInAction(() => {
                this.data.priceLeftToRight = undefined
                this.data.priceRightToLeft = undefined
            })
        }

        runInAction(() => {
            this.data.priceDecimalsLeft = decimalsLeft
            this.data.priceDecimalsRight = decimalsRight

            this.state.isValid = new BigNumber(this.expectedAmount || 0).gt(0)
                && typeof (this.pair) !== 'undefined'
                && typeof (this.amount) !== 'undefined'
                && this.isEnoughLiquidity
                && new BigNumber(this.amount || 0).gt(0)
                && typeof (this.leftToken?.wallet) !== 'undefined'
                && new BigNumber(this.leftToken?.balance || 0).gte(this.amount)

            this.state.isLoading = false
        })
    }

    /**
     *
     * @param {TokenCache} [token]
     * @protected
     */
    protected async handleLeftTokenChange(token?: TokenCache): Promise<void> {
        if (token?.root === this.rightToken?.root) {
            this.data.rightToken = undefined
        }

        if (this.state.direction !== SwapDirection.LTR) {
            this.state.direction = SwapDirection.LTR
        }

        await this.handleTokensPairUpdate()
    }

    /**
     *
     * @param {TokenCache} [token]
     * @protected
     */
    protected async handleRightTokenChange(token?: TokenCache): Promise<void> {
        if (token?.root === this.leftToken?.root) {
            this.data.leftToken = undefined
        }

        const direction = this.leftAmount && !this.rightAmount
            ? SwapDirection.RTL
            : SwapDirection.LTR

        if (this.state.direction !== direction) {
            this.state.direction = direction
        }

        await this.handleTokensPairUpdate()
    }

    /**
     *
     * @protected
     */
    protected async handleTokensPairUpdate(): Promise<void> {
        if (this.isLoading || !this.wallet.address) {
            return
        }

        if (!this.leftToken?.root || !this.rightToken?.root) {
            this.state.isLoading = false
            this.state.pair = undefined
            this.state.pairExist = false
            return
        }

        this.state.isLoading = true

        await checkPair(
            this.leftToken.root,
            this.rightToken.root,
        ).then(pair => {
            runInAction(() => {
                this.state.isLoading = false
                this.state.pair = pair
                this.state.pairExist = !!pair
            })
        }).catch(() => {
            runInAction(() => {
                this.state.isLoading = false
                this.state.pair = undefined
                this.state.pairExist = false
            })
        })
        await this.handleAmountChange()
    }

    /**
     *
     * @param {Transaction} transaction
     * @protected
     */
    protected handleTransactionResult(transaction: WalletData['transaction']): void {
        if (
            !this.state.processingId
            || !this.wallet.address
            || !transaction?.inMessage.body
        ) {
            return
        }

        const owner = new Contract(DexAbi.Callbacks, new Address(this.wallet.address))

        owner.decodeTransaction({
            transaction: toJS(transaction), // Convert Proxy to simple object
            methods: [
                'dexPairExchangeSuccess',
                'dexPairOperationCancelled',
            ],
        }).then(res => {
            if (
                res?.method === 'dexPairOperationCancelled'
                && res.input.id.toString() === this.state.processingId
            ) {
                runInAction(() => {
                    this.transactionResult = {
                        success: false,
                    }

                    this.state.isSwapping = false
                    this.state.isLoading = false

                    delete this.state.processingId
                })
            }
            else if (
                res?.method === 'dexPairExchangeSuccess'
                && res.input.id.toString() === this.state.processingId
            ) {
                runInAction(() => {
                    this.transactionResult = {
                        receivedAmount: (res.input.result as any).received.toString(),
                        receivedDecimals: this.rightToken?.decimals,
                        receivedIcon: this.rightToken?.icon,
                        receivedRoot: this.rightToken?.root,
                        receivedSymbol: this.rightToken?.symbol,

                        spentAmount: (res.input.result as any).spent.toString(),
                        spentDecimals: this.leftToken?.decimals,
                        spentFee: (res.input.result as any).fee.toString(),
                        spentSymbol: this.leftToken?.symbol,

                        success: true,

                        transactionHash: transaction.id.hash,
                    }

                    this.state.isSwapping = false
                    this.state.isLoading = false
                    this.state.isValid = false

                    delete this.state.processingId

                    this.data.leftAmount = ''
                    this.data.rightAmount = ''
                })
            }
        }).catch(e => {
            error('decodeTransaction error: ', e)
            runInAction(() => {
                this.transactionResult = {
                    success: false,
                }

                this.state.isSwapping = false
                this.state.isLoading = false

                delete this.state.processingId
            })
        })
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
            this.data.slippage = '0.5'
        }
        else {
            this.data.slippage = val.toString()
        }

        if (this.expectedAmount) {
            this.bill.minExpectedAmount = new BigNumber(this.expectedAmount)
                .div(100)
                .times(new BigNumber(100).minus(this.slippage))
                .dp(0, BigNumber.ROUND_DOWN)
                .toString()
        }
    }

    /**
     *
     */
    public start(): void {
        this.#amountsDisposer = reaction(() => [this.leftAmount, this.rightAmount], this.handleAmountChange, {
            delay: 700,
        })
        this.#leftTokenDisposer = reaction(() => this.leftToken, this.handleLeftTokenChange)
        this.#rightTokenDisposer = reaction(() => this.rightToken, this.handleRightTokenChange)
        this.#slippageDisposer = reaction(() => this.slippage, this.handleSlippageChange)
        this.#transactionDisposer = reaction(() => this.wallet.transaction, this.handleTransactionResult)

        this.handleTokensPairUpdate()
    }

    /**
     * Manually dispose all of the internal subscribers.
     * Clean last transaction result, reset swap `bill`, `state` and `data` to default values.
     */
    public dispose(): void {
        this.#leftTokenDisposer?.()
        this.#rightTokenDisposer?.()
        this.#transactionDisposer?.()
        this.cleanTransactionResult()
        this.cleanup()
    }

    /**
     * Manually clean last transaction result
     */
    public cleanTransactionResult(): void {
        this.transactionResult = undefined
    }

    /**
     * Reset swap `bill`, `state` and `data` to default values.
     * The selected token's pair will not be reset.
     * @private
     */
    private cleanup(): void {
        this.bill = DEFAULT_SWAP_BILL
        this.data = {
            ...DEFAULT_SWAP_DATA,
            leftToken: this.leftToken,
            rightToken: this.rightToken,
        }
        this.state = DEFAULT_SWAP_STATE
    }

    public get amount(): SwapBill['amount'] {
        return this.bill.amount
    }

    public get expectedAmount(): SwapBill['expectedAmount'] {
        return this.bill.expectedAmount
    }

    public get fee(): SwapBill['fee'] {
        return this.bill.fee
    }

    public get minExpectedAmount(): SwapBill['minExpectedAmount'] {
        return this.bill.minExpectedAmount
    }

    public get priceImpact(): SwapBill['priceImpact'] {
        return this.bill.priceImpact
    }

    public get leftAmount(): SwapData['leftAmount'] {
        return this.data.leftAmount
    }

    public get leftToken(): SwapData['leftToken'] {
        return this.data.leftToken
    }

    public get priceDecimalsLeft(): SwapData['priceDecimalsLeft'] {
        return this.data.priceDecimalsLeft
    }

    public get priceDecimalsRight(): SwapData['priceDecimalsRight'] {
        return this.data.priceDecimalsRight
    }

    public get priceLeftToRight(): SwapData['priceLeftToRight'] {
        return this.data.priceLeftToRight
    }

    public get priceRightToLeft(): SwapData['priceRightToLeft'] {
        return this.data.priceRightToLeft
    }

    public get rightAmount(): SwapData['rightAmount'] {
        return this.data.rightAmount
    }

    public get rightToken(): SwapData['rightToken'] {
        return this.data.rightToken
    }

    public get slippage(): SwapData['slippage'] {
        return this.data.slippage
    }

    public get direction(): SwapState['direction'] {
        return this.state.direction
    }

    public get isEnoughLiquidity(): SwapState['isEnoughLiquidity'] {
        return this.state.isEnoughLiquidity
    }

    public get isLoading(): SwapState['isLoading'] {
        return this.state.isLoading
    }

    public get isSwapping(): SwapState['isSwapping'] {
        return this.state.isSwapping
    }

    public get isValid(): SwapState['isValid'] {
        return this.state.isValid
    }

    public get pair(): SwapState['pair'] {
        return this.state.pair
    }

    public get pairExist(): SwapState['pairExist'] {
        return this.state.pairExist
    }

    public get priceDirection(): SwapState['priceDirection'] {
        return this.state.priceDirection
    }

    public get transaction(): SwapTransactionResult | undefined {
        return this.transactionResult
    }

    #amountsDisposer: IReactionDisposer | undefined

    #leftTokenDisposer: IReactionDisposer | undefined

    #rightTokenDisposer: IReactionDisposer | undefined

    #slippageDisposer: IReactionDisposer | undefined

    #transactionDisposer: IReactionDisposer | undefined

}


const Swap = new SwapStore()

export function useSwap(): SwapStore {
    return Swap
}
