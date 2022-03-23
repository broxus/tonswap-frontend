import BigNumber from 'bignumber.js'
import { Address, Subscriber } from 'everscale-inpage-provider'
import * as E from 'fp-ts/Either'
import { computed, makeObservable, toJS } from 'mobx'

import { useRpcClient } from '@/hooks/useRpcClient'
import { checkPair, DexAbi, TokenWallet } from '@/misc'
import { DEFAULT_SLIPPAGE_VALUE, DEFAULT_SWAP_BILL } from '@/modules/Swap/constants'
import { useSwapApi } from '@/modules/Swap/hooks/useApi'
import { BaseSwapStore } from '@/modules/Swap/stores/BaseSwapStore'
import {
    getDefaultPerPrice,
    getDirectExchangePriceImpact,
    getExchangePerPrice,
    getExpectedExchange,
    getExpectedSpendAmount,
    getSlippageMinExpectedAmount,
} from '@/modules/Swap/utils'
import { TokensCacheService } from '@/stores/TokensCacheService'
import { WalletService } from '@/stores/WalletService'
import { debug, error, isGoodBignumber } from '@/utils'
import type {
    DirectSwapStoreData,
    DirectSwapStoreInitialData,
    DirectSwapStoreState,
    DirectTransactionCallbacks,
    DirectTransactionFailureResult,
    DirectTransactionSuccessResult,
} from '@/modules/Swap/types'


const rpc = useRpcClient()


export class DirectSwapStore extends BaseSwapStore<DirectSwapStoreData, DirectSwapStoreState> {

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly initialData?: DirectSwapStoreInitialData,
        protected readonly callbacks?: DirectTransactionCallbacks,
    ) {
        super(tokensCache, initialData)

        this.setData({
            coin: initialData?.coin,
            bill: DEFAULT_SWAP_BILL,
            leftAmount: initialData?.leftAmount ?? '',
            leftToken: initialData?.leftToken,
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
            DirectSwapStore,
            | 'isPairInverted'
            | 'pairLeftBalanceNumber'
            | 'pairRightBalanceNumber'
        >(this, {
            amount: computed,
            expectedAmount: computed,
            fee: computed,
            minExpectedAmount: computed,
            pair: computed,
            priceImpact: computed,
            isLowTvl: computed,
            isPairChecking: computed,
            isEnoughLiquidity: computed,
            isValid: computed,
            isPairInverted: computed,
            pairLeftBalanceNumber: computed,
            pairRightBalanceNumber: computed,
        })

        this.#transactionSubscriber = new rpc.Subscriber()
    }


    /*
     * Public actions. Useful in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public async prepare(): Promise<void> {
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

            try {
                if (isPredefinedTokens) {
                    const api = useSwapApi()
                    const { tvl } = await api.pair({
                        address: this.pair.address.toString(),
                    })
                    this.setState('isLowTvl', new BigNumber(tvl ?? 0).lt(5e4))
                    debug('TVL is less than 50k?', this.state.isLowTvl)
                }
            }
            catch (e) {
                error('Check Tvl error', e)
            }

            try {
                await this.syncPairState()

                await Promise.all([
                    this.syncPairBalances(),
                    this.syncPairData(),
                ])

                if (this.isLowTvl) {
                    this.setData({
                        priceLeftToRight: undefined,
                        priceRightToLeft: undefined,
                    })
                }
                else {
                    this.finalizeCalculation()
                }
            }
            catch (e) {
                error('Sync pair data error', e)
            }
        }

        this.setState('isPairChecking', false)
    }

    /**
     * Manually start direct swap process.
     * @returns {Promise<void>}
     */
    public async submit(..._: any[]): Promise<void> {
        if (!this.isValid) {
            this.setState('isSwapping', false)
            return
        }

        this.setState('isSwapping', true)

        const deployGrams = this.rightToken?.balance === undefined ? '100000000' : '0'

        const pairWallet = await TokenWallet.walletAddress({
            root: this.leftTokenAddress!,
            owner: this.pair!.address!,
        })

        const processingId = new BigNumber(
            Math.floor(
                Math.random() * (Number.MAX_SAFE_INTEGER - 1),
            ) + 1,
        ).toFixed()

        const payload = (await this.pair!.contract!
            .methods.buildExchangePayload({
                deploy_wallet_grams: deployGrams,
                expected_amount: this.minExpectedAmount!,
                id: processingId,
            })
            .call({
                cachedState: toJS(this.pair!.state),
            })).value0

        let stream = this.#transactionSubscriber?.transactions(this.wallet.account!.address)

        const oldStream = this.#transactionSubscriber?.oldTransactions(this.wallet.account!.address, {
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
                    this.setState('isSwapping', false)
                    return E.left({ input: result.input })
                }

                if (result.method === 'dexPairExchangeSuccess' && result.input.id.toString() === processingId) {
                    this.setState('isSwapping', false)
                    return E.right({ input: result.input, transaction })
                }
            }

            return undefined
        }).first()

        try {
            await TokenWallet.send({
                address: new Address(this.leftToken!.wallet!),
                grams: new BigNumber(2500000000).plus(deployGrams).toFixed(),
                owner: this.wallet.account!.address,
                payload,
                recipient: pairWallet,
                tokens: this.amount!,
            })

            if (resultHandler !== undefined) {
                E.match(
                    (r: DirectTransactionFailureResult) => {
                        this.setState('isSwapping', false)
                        this.callbacks?.onTransactionFailure?.(r)
                    },
                    (r: DirectTransactionSuccessResult) => {
                        this.setState('isSwapping', false)
                        this.callbacks?.onTransactionSuccess?.(r)
                    },
                )(await resultHandler)
            }
        }
        catch (e) {
            error('decodeTransaction error: ', e)
            this.setState('isSwapping', false)
        }
    }

    /**
     * Invalidate bills data and recalculate
     */
    public forceInvalidate(): void {
        this.setData({
            bill: DEFAULT_SWAP_BILL,
            priceLeftToRight: undefined,
            priceRightToLeft: undefined,
        })
        this.finalizeCalculation()
    }

    /**
     * Calculate bill by the changes in the left amount field.
     * @param {boolean} [force] - pass `true` to calculate in background without loadings
     * @protected
     */
    public async calculateLeftToRight(force: boolean = false): Promise<void> {
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
    public async calculateRightToLeft(force?: boolean): Promise<void> {
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
     * Full reset
     * @protected
     */
    public reset(): void {
        this.setData({
            bill: DEFAULT_SWAP_BILL,
            leftAmount: '',
            leftToken: undefined,
            pair: undefined,
            priceLeftToRight: undefined,
            priceRightToLeft: undefined,
            rightAmount: '',
            rightToken: undefined,
            slippage: this.data.slippage,
            transaction: undefined,
        })
        this.setState({
            isCalculating: false,
            isSwapping: false,
            isLowTvl: false,
            isPairChecking: false,
        })
    }

    /*
     * Memoized store data and state values
     * ----------------------------------------------------------------------------------
     */

    /**
     * Returns bill amount value
     * @returns {DirectSwapStoreData['bill']['amount']}
     */
    public get amount(): DirectSwapStoreData['bill']['amount'] {
        return this.data.bill.amount
    }

    /**
     * Returns bill expected amount value
     * @returns {DirectSwapStoreData['bill']['amount']}
     */
    public get expectedAmount(): DirectSwapStoreData['bill']['expectedAmount'] {
        return this.data.bill.expectedAmount
    }

    /**
     * Returns bill fee value
     * @returns {DirectSwapStoreData['bill']['fee']}
     */
    public get fee(): DirectSwapStoreData['bill']['fee'] {
        return this.data.bill.fee
    }

    /**
     * Returns bill min expected amount value
     * @returns {DirectSwapStoreData['bill']['minExpectedAmount']}
     */
    public get minExpectedAmount(): DirectSwapStoreData['bill']['minExpectedAmount'] {
        return this.data.bill.minExpectedAmount
    }

    /**
     * Returns memoized current direct pair
     * @returns {DirectSwapStoreData['pair']}
     */
    public get pair(): DirectSwapStoreData['pair'] {
        return this.data.pair
    }

    /**
     * Returns bill price impact value
     * @returns {DirectSwapStoreData['bill']['priceImpact']}
     */
    public get priceImpact(): DirectSwapStoreData['bill']['priceImpact'] {
        return this.data.bill.priceImpact
    }

    /**
     * Price of right token per 1 left token
     * @returns {DirectSwapStoreData['priceLeftToRight']}
     */
    public get priceLeftToRight(): DirectSwapStoreData['priceLeftToRight'] {
        return this.data.priceLeftToRight
    }

    /**
     * Price of left token per 1 right token
     * @returns {DirectSwapStoreData['priceRightToLeft']}
     */
    public get priceRightToLeft(): DirectSwapStoreData['priceRightToLeft'] {
        return this.data.priceRightToLeft
    }

    /**
     *
     * @returns {DirectSwapStoreState['isLowTvl']}
     */
    public get isLowTvl(): DirectSwapStoreState['isLowTvl'] {
        return this.state.isLowTvl
    }

    /**
     *
     * @returns {DirectSwapStoreState['isPairChecking']}
     */
    public get isPairChecking(): DirectSwapStoreState['isPairChecking'] {
        return this.state.isPairChecking
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
            return this.rightAmountNumber.lt(
                this.isPairInverted
                    ? this.pairLeftBalanceNumber
                    : this.pairRightBalanceNumber,
            )
        }

        return (
            !this.pairLeftBalanceNumber.isZero()
            && !this.pairRightBalanceNumber.isZero()
        )
    }

    /**
     * Returns `true` if all data and bill is valid, otherwise `false`.
     * @returns {boolean}
     */
    public get isValid(): boolean {
        return (
            this.isEnoughLiquidity
            && this.wallet.account?.address !== undefined
            && this.pair?.address !== undefined
            && this.pair?.contract !== undefined
            && this.leftToken?.wallet !== undefined
            && this.leftTokenAddress !== undefined
            && isGoodBignumber(this.amount || 0)
            && isGoodBignumber(this.expectedAmount || 0)
            && isGoodBignumber(this.minExpectedAmount || 0)
            && isGoodBignumber(this.leftAmount || 0)
        )
    }

    /**
     * Returns `true` if selected tokens is inverted to the exists pair.
     * @returns {boolean}
     * @protected
     */
    protected get isPairInverted(): boolean {
        return this.pair?.roots?.left.toString() !== this.leftToken?.root
    }

    /**
     * Returns pair raw left balance as BigNumber instance
     * @protected
     */
    protected get pairLeftBalanceNumber(): BigNumber {
        return new BigNumber(this.pair?.balances?.left || 0)
    }

    /**
     Returns pair raw right balance as BigNumber instance
     * @protected
     */
    protected get pairRightBalanceNumber(): BigNumber {
        return new BigNumber(this.pair?.balances?.right || 0)
    }


    /*
     * Internal utilities methods
     * ----------------------------------------------------------------------------------
     */

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

        let amountBN = new BigNumber(this.amount || 0)
        const expectedAmountBN = new BigNumber(this.expectedAmount || 0)

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

        this.setData('bill', {
            ...this.data.bill,
            priceImpact: getDirectExchangePriceImpact(
                pairRightBalanceBN.div(pairLeftBalanceBN).times(amountBN),
                expectedAmountBN,
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
            error(e)
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

    /**
     * Internal swap transaction subscriber
     * @type {Subscriber}
     * @protected
     */
    #transactionSubscriber: Subscriber | undefined

}
