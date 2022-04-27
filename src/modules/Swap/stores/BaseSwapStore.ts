import BigNumber from 'bignumber.js'
import { Address } from 'everscale-inpage-provider'
import { computed, makeObservable, toJS } from 'mobx'

import { DEFAULT_DECIMALS, DEFAULT_SLIPPAGE_VALUE, DEFAULT_SWAP_BILL } from '@/modules/Swap/constants'
import { BaseStore } from '@/stores/BaseStore'
import { TokenCache, TokensCacheService } from '@/stores/TokensCacheService'
import {
    debug,
    error,
    formattedBalance,
    isGoodBignumber,
} from '@/utils'
import type {
    BaseSwapStoreData,
    BaseSwapStoreInitialData,
    BaseSwapStoreState,
} from '@/modules/Swap/types'
import {
    getDefaultPerPrice,
    getDirectExchangePriceImpact,
    getExchangePerPrice,
    getExpectedExchange,
    getExpectedSpendAmount,
    getSlippageMinExpectedAmount,
} from '@/modules/Swap/utils'
import { checkPair, DexAbi } from '@/misc'
import { useSwapApi } from '@/modules/Swap/hooks/useApi'
import { useRpcClient } from '@/hooks/useRpcClient'


const rpc = useRpcClient()


export class BaseSwapStore<
    T extends BaseSwapStoreData | Record<string, any>,
    U extends BaseSwapStoreState | Record<string, any>
> extends BaseStore<T, U> {

    constructor(
        protected readonly tokensCache: TokensCacheService,
        protected readonly initialData?: BaseSwapStoreInitialData,
    ) {
        super()

        this.setData({
            bill: DEFAULT_SWAP_BILL,
            leftAmount: initialData?.leftAmount ?? '',
            leftToken: initialData?.leftToken,
            pair: undefined,
            rightAmount: initialData?.rightAmount ?? '',
            rightToken: initialData?.rightToken,
            slippage: initialData?.slippage ?? DEFAULT_SLIPPAGE_VALUE,
        })

        this.setState({
            isCalculating: false,
            isLowTvl: false,
            isPairChecking: false,
            isSwapping: false,
        })

        makeObservable<
            BaseSwapStore<T, U>,
            | 'leftTokenAddress'
            | 'rightTokenAddress'
        >(this, {
            amount: computed,
            expectedAmount: computed,
            fee: computed,
            minExpectedAmount: computed,
            leftAmount: computed,
            pair: computed,
            priceImpact: computed,
            priceLeftToRight: computed,
            priceRightToLeft: computed,
            rightAmount: computed,
            slippage: computed,
            transaction: computed,
            isCalculating: computed,
            isLowTvl: computed,
            isPairChecking: computed,
            isSwapping: computed,
            isEnoughLiquidity: computed,
            isLeftAmountValid: computed,
            isRightAmountValid: computed,
            isPairInverted: computed,
            leftAmountNumber: computed,
            leftToken: computed,
            leftTokenAddress: computed,
            leftTokenDecimals: computed,
            pairLeftBalanceNumber: computed,
            pairRightBalanceNumber: computed,
            rightAmountNumber: computed,
            rightToken: computed,
            rightTokenAddress: computed,
            rightTokenDecimals: computed,
            formattedLeftBalance: computed,
            formattedRightBalance: computed,
        })
    }


    /*
     * Memoized store data and state values
     * ----------------------------------------------------------------------------------
     */

    /**
     * Returns bill amount value
     * @returns {BaseSwapStoreData['bill']['amount']}
     */
    public get amount(): BaseSwapStoreData['bill']['amount'] {
        return this.data.bill.amount
    }

    /**
     * Returns bill expected amount value
     * @returns {BaseSwapStoreData['bill']['amount']}
     */
    public get expectedAmount(): BaseSwapStoreData['bill']['expectedAmount'] {
        return this.data.bill.expectedAmount
    }

    /**
     * Returns bill fee value
     * @returns {BaseSwapStoreData['bill']['fee']}
     */
    public get fee(): BaseSwapStoreData['bill']['fee'] {
        return this.data.bill.fee
    }

    /**
     * Returns bill min expected amount value
     * @returns {BaseSwapStoreData['bill']['minExpectedAmount']}
     */
    public get minExpectedAmount(): BaseSwapStoreData['bill']['minExpectedAmount'] {
        return this.data.bill.minExpectedAmount
    }

    /**
     * Returns memoized left amount value
     * @returns {BaseSwapStoreData['leftAmount']}
     */
    public get leftAmount(): BaseSwapStoreData['leftAmount'] {
        return this.data.leftAmount
    }

    /**
     * Returns memoized current direct pair
     * Proxy to direct swap store instance
     * @returns {BaseSwapStoreData['pair']}
     */
    public get pair(): BaseSwapStoreData['pair'] {
        return this.data.pair
    }

    /**
     * Returns bill price impact value
     * @returns {BaseSwapStoreData['bill']['priceImpact']}
     */
    public get priceImpact(): BaseSwapStoreData['bill']['priceImpact'] {
        return this.data.bill.priceImpact
    }

    /**
     * Price of right token per 1 left token
     * @returns {BaseSwapStoreData['priceLeftToRight']}
     */
    public get priceLeftToRight(): BaseSwapStoreData['priceLeftToRight'] {
        return this.data.priceLeftToRight
    }

    /**
     * Price of left token per 1 right token
     * @returns {BaseSwapStoreData['priceRightToLeft']}
     */
    public get priceRightToLeft(): BaseSwapStoreData['priceRightToLeft'] {
        return this.data.priceRightToLeft
    }

    /**
     * Returns memoized right amount value
     * @returns {BaseSwapStoreData['rightAmount']}
     */
    public get rightAmount(): BaseSwapStoreData['rightAmount'] {
        return this.data.rightAmount
    }

    /**
     * Returns memoized slippage tolerance value
     * @returns {BaseSwapStoreData['slippage']}
     */
    public get slippage(): BaseSwapStoreData['slippage'] {
        return this.data.slippage
    }

    /**
     * Returns swap transaction receipt shape
     * @returns {BaseSwapStoreData['transaction'] | undefined}
     */
    public get transaction(): BaseSwapStoreData['transaction'] | undefined {
        return this.data.transaction
    }

    /**
     * Returns `true` if data is calculating
     * @returns {BaseSwapStoreState['isCalculating']}
     */
    public get isCalculating(): BaseSwapStoreState['isCalculating'] {
        return this.state.isCalculating
    }

    /**
     *
     * @returns {BaseSwapStoreState['isLowTvl']}
     */
    public get isLowTvl(): BaseSwapStoreState['isLowTvl'] {
        return this.state.isLowTvl
    }

    /**
     *
     * @returns {BaseSwapStoreState['isPairChecking']}
     */
    public get isPairChecking(): BaseSwapStoreState['isPairChecking'] {
        return this.state.isPairChecking
    }

    /**
     * Returns `true` if swap process is running
     * @returns {BaseSwapStoreState['isSwapping']}
     */
    public get isSwapping(): BaseSwapStoreState['isSwapping'] {
        return this.state.isSwapping
    }


    /*
     * Computed values
     * ----------------------------------------------------------------------------------
     */

    /**
     * Returns `true` if pair has enough liquidity
     * @returns {boolean}
     */
    public get isEnoughLiquidity(): boolean {
        if (isGoodBignumber(this.rightAmountNumber)) {
            const pairRightBalanceNumber = this.isPairInverted
                ? this.pairLeftBalanceNumber
                : this.pairRightBalanceNumber
            return this.rightAmountNumber.lt(pairRightBalanceNumber)
        }

        return !this.pairLeftBalanceNumber.isZero() && !this.pairRightBalanceNumber.isZero()
    }

    /**
     * Returns `true` if left amount value is valid, otherwise `false`.
     * NOTE: Use it only in UI for determining field validation and
     * DON'T USE it in internal calculations or validations
     * @returns {boolean}
     */
    public get isLeftAmountValid(): boolean {
        if (this.leftAmount.length === 0) {
            return true
        }
        return isGoodBignumber(this.leftAmountNumber, false) && this.leftBalanceNumber.gte(this.leftAmountNumber)
    }

    /**
     * Returns `true` if right amount value is valid, otherwise `false`.
     * NOTE: Use it only in UI for determining field validation and
     * DON'T USE it in internal calculations or validations
     * @returns {boolean}
     */
    public get isRightAmountValid(): boolean {
        if (this.rightAmount.length === 0) {
            return true
        }
        return this.rightAmount.length > 0 && isGoodBignumber(this.rightAmountNumber)
    }

    /**
     * Returns `true` if selected tokens is inverted to the exists pair.
     * @returns {boolean}
     * @protected
     */
    public get isPairInverted(): boolean {
        return this.pair?.roots?.left.toString() !== this.leftToken?.root
    }

    /**
     * Returns BigNumber of the left amount value whose shifted by left token decimals
     * @returns {BigNumber}
     * @protected
     */
    public get leftAmountNumber(): BigNumber {
        return new BigNumber(this.data.leftAmount)
            .shiftedBy(this.leftTokenDecimals)
            .dp(0, BigNumber.ROUND_DOWN)
    }

    /**
     Returns BigNumber of the left token balance
     */
    public get leftBalanceNumber(): BigNumber {
        return new BigNumber(this.leftToken?.balance || 0)
    }

    /**
     * Returns memoized left selected token
     * @returns {TokenCache | undefined}
     */
    public get leftToken(): TokenCache | undefined {
        return this.tokensCache.get(this.data.leftToken)
    }

    /**
     * Returns left token `Address` instance if left token is selected, otherwise returns `undefined`.
     * @returns {Address | undefined}
     * @protected
     */
    protected get leftTokenAddress(): Address | undefined {
        return this.leftToken?.root !== undefined ? new Address(this.leftToken.root) : undefined
    }

    /**
     * Returns memoized left token decimals or global default decimals - 18.
     * @returns {boolean}
     */
    public get leftTokenDecimals(): number {
        return this.leftToken?.decimals ?? DEFAULT_DECIMALS
    }

    /**
     * Returns BigNumber of the pair left balance value
     * @protected
     */
    public get pairLeftBalanceNumber(): BigNumber {
        return new BigNumber(this.pair?.balances?.left || 0)
    }

    /**
     * Returns BigNumber of the pair right balance value
     * @protected
     */
    public get pairRightBalanceNumber(): BigNumber {
        return new BigNumber(this.pair?.balances?.right || 0)
    }

    /**
     * Returns BigNumber of the right amount value whose shifted by right token decimals
     * @returns {BigNumber}
     * @protected
     */
    public get rightAmountNumber(): BigNumber {
        return new BigNumber(this.data.rightAmount)
            .shiftedBy(this.rightTokenDecimals)
            .dp(0, BigNumber.ROUND_DOWN)
    }

    /**
     * Returns memoized right selected token
     * @returns {TokenCache | undefined}
     */
    public get rightToken(): TokenCache | undefined {
        return this.tokensCache.get(this.data.rightToken)
    }

    /**
     * Returns right token `Address` instance if right token is selected, otherwise returns `undefined`.
     * @returns {Address | undefined}
     * @protected
     */
    protected get rightTokenAddress(): Address | undefined {
        return this.rightToken?.root !== undefined ? new Address(this.rightToken.root) : undefined
    }

    /**
     * Returns memoized right token decimals or global default decimals - 18.
     * @returns {boolean}
     */
    public get rightTokenDecimals(): number {
        return this.rightToken?.decimals ?? DEFAULT_DECIMALS
    }

    /**
     * Returns left formatted balance
     * @returns {string}
     */
    public get formattedLeftBalance(): string {
        return formattedBalance(this.leftToken?.balance, this.leftTokenDecimals)
    }

    /**
     * Returns right formatted balance
     * @returns {string}
     */
    public get formattedRightBalance(): string {
        return formattedBalance(this.rightToken?.balance, this.rightTokenDecimals)
    }


    /*
     * Internal and external utilities methods
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    protected async prepare(): Promise<void> {
        if (this.data.leftToken === undefined || this.data.rightToken === undefined) {
            return
        }

        this.setState('isPairChecking', true)

        try {
            const address = await checkPair(this.data.leftToken, this.data.rightToken)
            this.setData('pair', address !== undefined ? {
                address,
                contract: new rpc.Contract(DexAbi.Pair, address),
            } : undefined)
        }
        catch (e) {
            error('Check pair error', e)
            this.setData('pair', undefined)
        }

        if (this.pair?.address !== undefined) {
            const isPredefinedTokens = this.tokensCache.verifiedBroxusTokens.filter(
                token => [this.data.leftToken, this.data.rightToken].includes(token.root),
            ).length >= 2

            if (isPredefinedTokens) {
                try {
                    const api = useSwapApi()
                    const { tvl } = await api.pair({
                        address: this.pair.address.toString(),
                    })
                    this.setState('isLowTvl', new BigNumber(tvl ?? 0).lt(5e4))
                    debug('TVL is less than 50k?', this.state.isLowTvl)
                }
                catch (e) {
                    error('Check Tvl error', e)
                }
            }

            try {
                await this.syncPairState()

                await Promise.all([
                    this.syncPairBalances(),
                    this.syncPairData(),
                ])

                this.finalizeCalculation()
            }
            catch (e) {
                error('Sync pair data error', e)
            }
        }

        this.setState('isPairChecking', false)
    }

    /**
     * Calculate bill by the changes in the left amount field.
     * @param {boolean} [force] - pass `true` to calculate in background without loadings
     * @protected
     */
    protected async calculateLeftToRight(force: boolean = false): Promise<void> {
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
                toJS(this.data),
                toJS(this.state),
            )
            return
        }

        this.setState('isCalculating', true)

        debug(
            'DirectSwap@calculateLeftToRight start',
            toJS(this.data),
            toJS(this.state),
        )

        if (this.isEnoughLiquidity && isGoodBignumber(this.leftAmountNumber) && this.leftTokenAddress !== undefined) {
            if (this.pair?.contract !== undefined) {
                try {
                    const {
                        expected_amount: expectedAmount,
                        expected_fee: fee,
                    } = await getExpectedExchange(
                        this.pair.contract,
                        this.leftAmountNumber.toFixed() || '0',
                        this.leftTokenAddress,
                        toJS(this.pair.state),
                    )

                    const expectedAmountBN = new BigNumber(expectedAmount || 0)
                    this.setData({
                        bill: {
                            amount: this.leftAmountNumber.toFixed(),
                            expectedAmount: expectedAmountBN.toFixed(),
                            fee,
                            minExpectedAmount: getSlippageMinExpectedAmount(
                                expectedAmountBN,
                                this.data.slippage,
                            ).toFixed(),
                        },
                        rightAmount: isGoodBignumber(expectedAmountBN)
                            ? expectedAmountBN.shiftedBy(-this.rightTokenDecimals).toFixed()
                            : '',
                    })
                }
                catch (e) {
                    error('Calculate left to right', e)
                }
            }
        }

        this.finalizeCalculation()

        this.setState('isCalculating', false)

        debug(
            'DirectSwap@calculateLeftToRight done',
            toJS(this.data),
            toJS(this.state),
        )
    }

    /**
     * Calculate bill by the changes in the right amount field.
     * @param {boolean} [force] - pass `true` to calculate in background without loadings
     * @protected
     */
    protected async calculateRightToLeft(force?: boolean): Promise<void> {
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
                toJS(this.data),
                toJS(this.state),
            )
            return
        }

        this.setState('isCalculating', true)

        debug(
            'DirectSwap@calculateRightToLeft start',
            toJS(this.data),
            toJS(this.state),
        )

        if (!this.isEnoughLiquidity) {
            this.setData('leftAmount', '')
        }

        if (this.isEnoughLiquidity && isGoodBignumber(this.rightAmountNumber) && this.rightTokenAddress !== undefined) {
            if (this.pair?.contract !== undefined) {
                try {
                    const {
                        expected_amount: expectedAmount,
                        expected_fee: fee,
                    } = await getExpectedSpendAmount(
                        this.pair.contract,
                        this.rightAmountNumber.toFixed(),
                        this.rightTokenAddress,
                        toJS(this.pair.state),
                    )

                    const expectedAmountBN = new BigNumber(expectedAmount || 0)

                    if (isGoodBignumber(expectedAmountBN)) {
                        this.setData({
                            bill: {
                                amount: expectedAmountBN.toFixed(),
                                expectedAmount: this.rightAmountNumber.toFixed(),
                                fee,
                                minExpectedAmount: getSlippageMinExpectedAmount(
                                    this.rightAmountNumber,
                                    this.data.slippage,
                                ).toFixed(),
                            },
                            leftAmount: expectedAmountBN.shiftedBy(-this.leftTokenDecimals).toFixed(),
                        })
                    }
                    else {
                        this.setData({
                            leftAmount: '',
                            rightAmount: '',
                        })
                    }
                }
                catch (e) {
                    error('Calculate right to left', e)
                }
            }
        }

        this.finalizeCalculation()

        this.setState('isCalculating', false)

        debug(
            'DirectSwap@calculateRightToLeft done',
            toJS(this.data),
            toJS(this.state),
        )
    }

    /**
     * Finalize amount change.
     * Calculate prices by sides and price impact.
     * @protected
     */
    protected finalizeCalculation(): void {
        if (!this.isEnoughLiquidity) {
            this.setData({
                priceLeftToRight: undefined,
                priceRightToLeft: undefined,
            })
            return
        }

        const pairLeftBalanceNumber = this.isPairInverted ? this.pairRightBalanceNumber : this.pairLeftBalanceNumber
        const pairRightBalanceNumber = this.isPairInverted ? this.pairLeftBalanceNumber : this.pairRightBalanceNumber

        let priceLeftToRight = getDefaultPerPrice(
                pairLeftBalanceNumber.shiftedBy(-this.leftTokenDecimals),
                pairRightBalanceNumber.shiftedBy(-this.rightTokenDecimals),
                this.leftTokenDecimals,
            ),
            priceRightToLeft = getDefaultPerPrice(
                pairRightBalanceNumber.shiftedBy(-this.rightTokenDecimals),
                pairLeftBalanceNumber.shiftedBy(-this.leftTokenDecimals),
                this.rightTokenDecimals,
            )

        if (
            !isGoodBignumber(this.rightAmountNumber)
            || this.amount === undefined
            || this.expectedAmount === undefined
            || this.pair === undefined
            || this.pair.contract === undefined
            || this.pair.denominator === undefined
            || this.pair.numerator === undefined
        ) {
            if (isGoodBignumber(priceLeftToRight)) {
                this.setData('priceLeftToRight', priceLeftToRight.toFixed())
            }

            if (isGoodBignumber(priceRightToLeft)) {
                this.setData('priceRightToLeft', priceRightToLeft.toFixed())
            }

            return
        }

        let amountNumber = new BigNumber(this.amount || 0)
        const expectedAmountNumber = new BigNumber(this.expectedAmount || 0)

        priceLeftToRight = getExchangePerPrice(
            amountNumber,
            expectedAmountNumber,
            this.rightTokenDecimals,
        )

        priceRightToLeft = getExchangePerPrice(
            expectedAmountNumber,
            amountNumber,
            this.leftTokenDecimals,
        )

        amountNumber = amountNumber
            .times(new BigNumber(this.pair.denominator).minus(this.pair.numerator))
            .div(this.pair.denominator)

        const expectedLeftPairBalanceNumber = pairLeftBalanceNumber.plus(amountNumber)
        const expectedRightPairBalanceNumber = pairRightBalanceNumber.minus(expectedAmountNumber)

        this.setData('bill', {
            ...this.data.bill,
            priceImpact: getDirectExchangePriceImpact(
                pairRightBalanceNumber.div(pairLeftBalanceNumber),
                expectedRightPairBalanceNumber.div(expectedLeftPairBalanceNumber),
            ).toFixed(),
        })

        if (isGoodBignumber(priceLeftToRight)) {
            this.setData('priceLeftToRight', priceLeftToRight.toFixed())
        }

        if (isGoodBignumber(priceRightToLeft)) {
            this.setData('priceRightToLeft', priceRightToLeft.toFixed())
        }
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
                answerId: 0,
            }).call({
                cachedState: toJS(this.pair.state),
            }),
            this.pair.contract.methods.getFeeParams({
                answerId: 0,
            }).call({
                cachedState: toJS(this.pair.state),
            }),
        ])

        this.setData('pair', {
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

            this.setData('pair', {
                ...this.pair,
                balances: { left, right },
            })
        }
        catch (e) {
            error('Sync pai balances error', e)
        }
    }

    /**
     * Sync and update direct pair token full contract state.
     * @protected
     */
    public async syncPairState(): Promise<void> {
        if (this.pair?.address === undefined) {
            return
        }

        const { state } = await rpc.getFullContractState({
            address: this.pair.address,
        })

        this.setData('pair', { ...this.pair, state })
    }

}
