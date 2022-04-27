import {
    computed, makeObservable, override, toJS,
} from 'mobx'
import BigNumber from 'bignumber.js'
import { Address, Subscriber } from 'everscale-inpage-provider'
import * as E from 'fp-ts/Either'
import type { DecodedAbiFunctionInputs, DecodedAbiFunctionOutputs } from 'everscale-inpage-provider'

import { useRpcClient } from '@/hooks/useRpcClient'
import { DexAbi, DexConstants, TokenWallet } from '@/misc'
import {
    DEFAULT_DECIMALS,
    DEFAULT_SLIPPAGE_VALUE,
    DEFAULT_SWAP_BILL,
} from '@/modules/Swap/constants'
import { BaseSwapStore } from '@/modules/Swap/stores/BaseSwapStore'
import { useSwapApi } from '@/modules/Swap/hooks/useApi'
import {
    fillStepResult,
    getCrossExchangePriceImpact,
    getCrossExchangeSlippage,
    getExchangePerPrice,
    getExpectedExchange,
    getExpectedSpendAmount,
    getReducedCrossExchangeFee,
    getSlippageMinExpectedAmount,
} from '@/modules/Swap/utils'
import { TokenCache, TokensCacheService } from '@/stores/TokensCacheService'
import { WalletService } from '@/stores/WalletService'
import { debug, error, isGoodBignumber } from '@/utils'
import type {
    BaseSwapStoreInitialData,
    CrossPairSwapFailureResult,
    CrossPairSwapStoreData,
    CrossPairSwapStoreState,
    CrossPairSwapTransactionCallbacks,
    DirectTransactionSuccessResult,
    SwapPair,
    SwapRoute,
    SwapRouteResult,
} from '@/modules/Swap/types'
import { CrossChainKind, NewCrossPairsRequest, NewCrossPairsResponse } from '@/modules/Pairs/types'


const rpc = useRpcClient()


export class CrossPairSwapStore extends BaseSwapStore<CrossPairSwapStoreData, CrossPairSwapStoreState> {

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly initialData?: BaseSwapStoreInitialData,
        protected readonly callbacks?: CrossPairSwapTransactionCallbacks,
    ) {
        super(tokensCache, initialData)

        this.setData({
            crossPairs: [],
            routes: [],
        })

        this.setState({
            isPreparing: false,
        })

        makeObservable(this, {
            amount: override,
            expectedAmount: override,
            fee: override,
            minExpectedAmount: override,
            priceImpact: override,
            priceLeftToRight: override,
            priceRightToLeft: override,
            route: computed,
            routes: computed,
        })

        this.#transactionSubscriber = new rpc.Subscriber()
    }


    /*
     * Public actions. Useful in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     * Load cross-pairs for each selected token,
     * find intersections and make cross-exchange routes.
     * Load and save all pairs.
     * Create routes by white list.
     * Check tokens wallets.
     * @param {string} amount
     * @param {CrossChainKind} direction
     * @protected
     */
    public async checkSuggestions(amount: string, direction: CrossChainKind): Promise<void> {
        if (
            this.isPreparing
            || this.isSwapping
            || this.leftToken === undefined
            || this.rightToken === undefined
        ) {
            return
        }

        debug('Prepare cross-pair')

        let response: NewCrossPairsResponse | undefined

        this.setState('isPreparing', true)

        try {
            response = await this.fetchCrossPairs(amount, direction)
        }
        catch (e) {
            error('Load cross-pairs error', e)
        }

        if (response === undefined) {
            this.setState('isPreparing', false)
            return
        }

        const crossPairs: SwapPair[] = response.pairs.map(item => {
            const address = new Address(item.pairAddress)
            const leftToken = this.tokensCache.get(item.leftAddress)
            const rightToken = this.tokensCache.get(item.rightAddress)
            return {
                address,
                contract: new rpc.Contract(DexAbi.Pair, address),
                decimals: {
                    left: leftToken?.decimals ?? DEFAULT_DECIMALS,
                    right: rightToken?.decimals ?? DEFAULT_DECIMALS,
                },
                roots: {
                    left: new Address(item.leftAddress),
                    right: new Address(item.rightAddress),
                },
                symbols: {
                    left: leftToken?.symbol ?? '',
                    right: rightToken?.symbol ?? '',
                },
            }
        })

        this.setData('crossPairs', crossPairs)

        await this.syncCrossExchangePairsStates()
        await this.syncCrossExchangePairs()
        await this.syncCrossExchangePairsBalances()

        const routes: SwapRoute[] = []
        const tokens: TokenCache[] = []
        const roots = this.data.crossPairs.reduce<string[]>((acc, pair) => {
            const pairRoots = [pair.roots?.left.toString(), pair.roots?.right.toString()]

            let idx = pairRoots.indexOf(this.leftToken?.root),
                // eslint-disable-next-line no-nested-ternary
                root = pairRoots[idx === 0 ? 1 : idx === 1 ? 0 : -1]

            if (root !== undefined && !acc.includes(root)) {
                acc.push(root)
            }

            idx = pairRoots.indexOf(this.rightToken?.root)
            // eslint-disable-next-line no-nested-ternary
            root = pairRoots[idx === 0 ? 1 : idx === 1 ? 0 : -1]

            if (root !== undefined && !acc.includes(root)) {
                acc.push(root)
            }

            return acc
        }, [])

        if (roots.length > 0) {
            try {
                await (
                    async () => {
                        // eslint-disable-next-line no-restricted-syntax
                        for (const root of roots) {
                            const token = this.tokensCache.get(root)
                            if (token !== undefined) {
                                await this.tokensCache.syncToken(token.root)
                                tokens.push(token)
                            }
                        }
                    }
                )()
            }
            catch (e) {

            }
            finally {
                if (tokens.length > 0) {
                    routes.push({
                        bill: {},
                        leftAmount: this.leftAmount,
                        pairs: [],
                        rightAmount: this.rightAmount,
                        slippage: this.data.slippage,
                        steps: [],
                        tokens,
                    })
                }

                this.setData('routes', routes)
            }
        }

        this.setState('isPreparing', false)
    }

    /**
     * Manually start cross-exchange swap process.
     */
    public async submit(): Promise<void> {
        if (
            this.wallet.account === undefined
            || !this.isValid
            || this.route === undefined
            || this.leftToken?.wallet === undefined
            || this.rightToken === undefined
        ) {
            return
        }

        const firstPair = this.route.pairs.slice().shift()

        if (firstPair?.address === undefined
            || firstPair.contract === undefined
        ) {
            this.setState('isSwapping', false)
            return
        }

        const tokens = this.route.tokens.slice()

        const deployGrams = tokens.concat(this.rightToken).some(
            token => token.balance === undefined,
        ) ? '100000000' : '0'

        const pairWallet = await TokenWallet.walletAddress({
            root: this.leftTokenAddress!,
            owner: firstPair.address,
        })

        const processingId = new BigNumber(
            Math.floor(
                Math.random() * (Number.MAX_SAFE_INTEGER - 1),
            ) + 1,
        ).toFixed()

        const steps = this.route.steps.slice()

        const minExpectedAmount = steps.slice().shift()?.minExpectedAmount as string
        const params: DecodedAbiFunctionInputs<typeof DexAbi.Pair, 'buildCrossPairExchangePayload'> = {
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

        this.setState('isSwapping', true)

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
                            transaction,
                            transaction.inMessage.src,
                            undefined,
                            'cancel',
                        ),
                    )

                    const cancelStepIndex = results.findIndex(
                        ({ status }) => status === 'cancel',
                    )

                    if (cancelStepIndex === 0) {
                        return E.left({})
                    }

                    results = results.slice(0, cancelStepIndex + 1)

                    if (results.some(({ status }) => status === undefined)) {
                        return undefined
                    }

                    return E.left({
                        cancelStep: results[cancelStepIndex],
                        index: cancelStepIndex,
                        step: results[cancelStepIndex - 1],
                    })
                }

                if (result.method === 'dexPairExchangeSuccess' && result.input.id.toString() === processingId) {
                    results = results.map(
                        res => fillStepResult(
                            res,
                            transaction,
                            transaction.inMessage.src,
                            result.input.result.received.toString(),
                            'success',
                            result.input,
                        ),
                    )

                    if (results.some(({ status }) => status === undefined) || results.length === 0) {
                        return undefined
                    }

                    if (results.length > 0 && results.every(({ status }) => status === 'success')) {
                        const stepResult = results.slice().pop() as SwapRouteResult
                        return E.right({
                            input: stepResult.input!,
                            transaction: stepResult.transaction!,
                        })
                    }

                    const cancelStepIndex = results.findIndex(
                        ({ status }) => status === 'cancel',
                    )

                    if (cancelStepIndex === 0) {
                        return E.left({})
                    }

                    if (cancelStepIndex > 0) {
                        return E.left({
                            cancelStep: results[cancelStepIndex],
                            index: cancelStepIndex,
                            step: results[cancelStepIndex - 1],
                        })
                    }
                }
            }

            return undefined
        }).first()

        try {
            await TokenWallet.send({
                address: new Address(this.leftToken.wallet),
                grams: new BigNumber(steps.length - 1)
                    .times(500000000)
                    .plus(2500000000)
                    .plus(deployGrams)
                    .toFixed(),
                owner: this.wallet.account.address,
                payload,
                recipient: pairWallet,
                tokens: this.route.bill.amount || '0',
            })

            if (resultHandler !== undefined) {
                E.match(
                    (r: CrossPairSwapFailureResult) => {
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
        this.setData('route', undefined)
        this.finalizeCalculation()
    }

    /**
     * Calculate cross-exchange `bill` by the changes in the left field.
     * @param {boolean} [force] - pass `true` to calculate in background without loadings
     * @protected
     */
    public async calculateLeftToRight(force: boolean = false): Promise<void> {
        if (!force && this.isCalculating) {
            return
        }

        if (
            this.leftToken === undefined
            || this.rightToken === undefined
            || !isGoodBignumber(this.leftAmountNumber)
        ) {
            return
        }

        this.setState('isCalculating', true)

        debug(
            'CrossPairSwapStore@calculateLeftToRight start',
            toJS(this.data),
            toJS(this.state),
        )

        await (
            async () => {
                const routes: SwapRoute[] = []

                // eslint-disable-next-line no-restricted-syntax
                for (const _route of this.routes) {
                    const route = { ..._route }
                    const tokens = this.getRouteTokensMap(route.tokens, true)

                    route.bill.amount = this.leftAmountNumber.toFixed()
                    route.bill.expectedAmount = this.leftAmountNumber.toFixed()
                    route.bill.minExpectedAmount = this.leftAmountNumber.toFixed()
                    route.pairs = []
                    route.steps = []

                    // eslint-disable-next-line no-restricted-syntax
                    for (const { idx, token } of tokens) {
                        if (idx + 1 < tokens.length) {
                            const { token: nextToken } = tokens[idx + 1]
                            const pair = this.getRouteStepPair(token.root, nextToken.root)

                            if (pair?.address === undefined) {
                                break
                            }

                            if (pair.contract === undefined) {
                                pair.contract = new rpc.Contract(DexAbi.Pair, pair.address)
                            }

                            route.pairs.push(pair)

                            const spentTokenAddress = new Address(token.root)

                            try {
                                const [
                                    {
                                        expected_amount: expectedAmount,
                                        expected_fee: fee,
                                    },
                                    { expected_amount: minExpectedAmount },
                                ]: DecodedAbiFunctionOutputs<
                                    typeof DexAbi.Pair,
                                    'expectedExchange'
                                >[] = await Promise.all([
                                    getExpectedExchange(
                                        pair.contract,
                                        route.bill.expectedAmount!,
                                        spentTokenAddress,
                                        toJS(pair.state),
                                    ),
                                    getExpectedExchange(
                                        pair.contract,
                                        route.bill.minExpectedAmount!,
                                        spentTokenAddress,
                                        toJS(pair.state),
                                    ),
                                ])

                                route.bill.minExpectedAmount = getSlippageMinExpectedAmount(
                                    new BigNumber(minExpectedAmount || 0),
                                    this.data.slippage,
                                ).toFixed()

                                route.steps.push({
                                    amount: route.bill.expectedAmount!,
                                    expectedAmount,
                                    fee,
                                    from: token.symbol,
                                    minExpectedAmount: route.bill.minExpectedAmount,
                                    pair,
                                    receiveAddress: new Address(nextToken.root),
                                    spentAddress: spentTokenAddress,
                                    to: nextToken.symbol,
                                })

                                route.bill.expectedAmount = expectedAmount
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

                this.setData('routes', routes)
            }
        )()

        const currentRoute = this.route && { ...this.route }
        const prevAmountBN = currentRoute?.bill.amount !== undefined
            ? new BigNumber(currentRoute.bill.amount || 0)
            : this.leftAmountNumber
        const isAmountDecreased = prevAmountBN.gt(this.leftAmountNumber)
        const directExpectedAmount = new BigNumber(this.data.bill.expectedAmount || 0)
        let bestExpectedAmount = new BigNumber(
                isAmountDecreased ? 0 : (currentRoute?.bill.expectedAmount || 0),
            ),
            bestRoute: SwapRoute | undefined

        this.setData('route', undefined)

        // eslint-disable-next-line no-restricted-syntax
        for (const route of this.routes) {
            if (route.steps.length === 0) {
                break
            }

            const expectedAmountNumber = new BigNumber(route.bill.expectedAmount || 0)

            if (expectedAmountNumber.gt(directExpectedAmount) && expectedAmountNumber.gt(bestExpectedAmount)) {
                const prices: Pick<SwapRoute, 'priceLeftToRight' | 'priceRightToLeft'> = {}

                const priceLeftToRight = getExchangePerPrice(
                    this.leftAmountNumber.shiftedBy(-this.leftTokenDecimals),
                    expectedAmountNumber.shiftedBy(-this.rightTokenDecimals),
                    this.leftTokenDecimals,
                )

                if (isGoodBignumber(priceLeftToRight)) {
                    prices.priceLeftToRight = priceLeftToRight.toFixed()
                }

                const priceRightToLeft = getExchangePerPrice(
                    expectedAmountNumber.shiftedBy(-this.rightTokenDecimals),
                    this.leftAmountNumber.shiftedBy(-this.leftTokenDecimals),
                    this.rightTokenDecimals,
                )

                if (isGoodBignumber(priceRightToLeft)) {
                    prices.priceRightToLeft = priceRightToLeft.toFixed()
                }

                bestRoute = {
                    ...route,
                    ...prices,
                    bill: {
                        ...route.bill,
                        expectedAmount: expectedAmountNumber.toFixed(),
                        fee: getReducedCrossExchangeFee(route.steps).toFixed(),
                        priceImpact: getCrossExchangePriceImpact(route.steps, this.leftToken.root).toFixed(),
                    },
                    leftAmount: this.leftAmountNumber.shiftedBy(-this.leftTokenDecimals).toFixed(),
                    rightAmount: expectedAmountNumber.shiftedBy(-this.rightTokenDecimals).toFixed(),
                    slippage: getCrossExchangeSlippage(this.data.slippage, route.steps.length),
                }

                bestExpectedAmount = expectedAmountNumber
            }
        }

        this.setData('route', bestRoute)

        this.setState('isCalculating', false)

        debug(
            'CrossPairSwapStore@calculateLeftToRight done',
            toJS(this.data),
            toJS(this.state),
        )
    }

    /**
     * Calculate cross-exchange `bill` by the changes in the right field.
     * @param {boolean} [force] - pass `true` to calculate in background without loadings
     * @param {boolean} [isEnoughLiquidity]
     * @protected
     */
    public async calculateRightToLeft(force: boolean = false, isEnoughLiquidity: boolean = false): Promise<void> {
        if (
            this.leftToken === undefined
            || this.rightToken === undefined
            || !isGoodBignumber(this.rightAmountNumber)
        ) {
            return
        }

        if (!force && this.isCalculating) {
            return
        }

        this.setState('isCalculating', true)

        debug(
            'CrossPairSwapStore@calculateRightToLeft invalidate routes',
            toJS(this.data),
            toJS(this.state),
        )

        let routes: SwapRoute[] = []

        await (
            async () => {
                const _routes: SwapRoute[] = []

                // eslint-disable-next-line no-restricted-syntax
                for (const _route of this.routes) {
                    const route = { ..._route }
                    const tokens = this.getRouteTokensMap(route.tokens, false)

                    route.bill.expectedAmount = this.rightAmountNumber.toFixed()
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
                                pair.contract = new rpc.Contract(DexAbi.Pair, pair.address)
                            }

                            route.pairs.unshift(pair)

                            const receiveTokenAddress = new Address(token.root)

                            try {
                                const {
                                    expected_amount: amount,
                                    expected_fee: fee,
                                } = await getExpectedSpendAmount(
                                    pair.contract,
                                    idx === 0 ? route.bill.expectedAmount! : route.bill.amount!,
                                    receiveTokenAddress,
                                    toJS(pair.state),
                                )

                                route.steps.unshift({
                                    amount,
                                    expectedAmount: idx === 0 ? route.bill.expectedAmount! : route.bill.amount!,
                                    fee,
                                    from: nextToken.symbol,
                                    minExpectedAmount: idx === 0 ? route.bill.expectedAmount! : route.bill.amount!,
                                    pair,
                                    receiveAddress: receiveTokenAddress,
                                    spentAddress: new Address(nextToken.root),
                                    to: token.symbol,
                                })

                                route.bill.amount = amount
                            }
                            catch (e) {
                                route.bill = {}
                                route.pairs = []
                                route.steps = []
                                error('Get expected spend amounts error', e, route, token)
                            }
                        }
                    }

                    route.bill.priceImpact = getCrossExchangePriceImpact(
                        route.steps,
                        this.leftToken!.root,
                    ).toFixed()

                    _routes.push(route)
                }

                routes = _routes
            }
        )()

        debug(
            'CrossPairSwapStore@calculateRightToLeft start',
            toJS({ ...this.data, routes }),
            toJS(this.state),
        )

        await (
            async () => {
                const _routes: SwapRoute[] = []

                // eslint-disable-next-line no-restricted-syntax
                for (const _route of routes) {
                    const route = { ..._route }
                    const steps = route.steps.map((step, idx) => ({ idx, step }))

                    // eslint-disable-next-line no-restricted-syntax
                    for (const { idx, step } of steps) {
                        if (step.pair?.address === undefined) {
                            break
                        }

                        if (step.pair.contract === undefined) {
                            step.pair.contract = new rpc.Contract(DexAbi.Pair, step.pair.address)
                        }

                        try {
                            const {
                                expected_amount: expectedAmount,
                            } = await getExpectedExchange(
                                step.pair.contract,
                                idx === 0 ? route.bill.amount! : route.bill.minExpectedAmount!,
                                step.spentAddress,
                                toJS(step.pair.state),
                            )

                            route.bill.minExpectedAmount = getSlippageMinExpectedAmount(
                                new BigNumber(expectedAmount || 0),
                                this.data.slippage,
                            ).toFixed() as string


                            step.expectedAmount = expectedAmount
                            step.minExpectedAmount = route.bill.minExpectedAmount
                        }
                        catch (e) {
                            error('Get reverted min expected amount error', e)
                        }
                    }

                    _routes.push(route)
                }

                routes = _routes
            }
        )()

        const currentRoute = this.data.route && { ...this.data.route }
        const prevAmountBN = currentRoute?.bill.amount !== undefined
            ? new BigNumber(currentRoute.bill.amount || 0)
            : this.rightAmountNumber
        const isAmountDecreased = prevAmountBN.gte(this.rightAmountNumber)
        const directAmount = new BigNumber(this.data.bill.amount || 0)
        let bestAmount = new BigNumber(
                isAmountDecreased ? 0 : (currentRoute?.bill.amount || 0),
            ),
            bestRoute: SwapRoute | undefined

        this.setData('route', undefined)

        // eslint-disable-next-line no-restricted-syntax
        for (const route of routes) {
            if (route.steps.length === 0) {
                break
            }

            const amountBN = new BigNumber(route.bill.amount || 0)

            if (
                !isEnoughLiquidity
                || (directAmount.isZero() && amountBN.gt(0))
                || (directAmount.gt(amountBN) && (bestAmount.isZero() || bestAmount.gt(amountBN)))
            ) {
                const prices: Pick<SwapRoute, 'priceLeftToRight' | 'priceRightToLeft'> = {}

                const priceLeftToRight = getExchangePerPrice(
                    amountBN.shiftedBy(-this.leftTokenDecimals),
                    this.rightAmountNumber.shiftedBy(-this.rightTokenDecimals),
                    this.leftTokenDecimals,
                )

                if (isGoodBignumber(priceLeftToRight)) {
                    prices.priceLeftToRight = priceLeftToRight.toFixed()
                }

                const priceRightToLeft = getExchangePerPrice(
                    this.rightAmountNumber.shiftedBy(-this.rightTokenDecimals),
                    amountBN.shiftedBy(-this.leftTokenDecimals),
                    this.rightTokenDecimals,
                )

                if (isGoodBignumber(priceRightToLeft)) {
                    prices.priceRightToLeft = priceRightToLeft.toFixed()
                }

                bestRoute = {
                    ...route,
                    ...prices,
                    bill: {
                        ...route.bill,
                        amount: amountBN.toFixed(),
                        fee: getReducedCrossExchangeFee(route.steps).toFixed(),
                    },
                    leftAmount: amountBN.shiftedBy(-this.leftTokenDecimals).toFixed(),
                    rightAmount: this.rightAmountNumber.shiftedBy(-this.rightTokenDecimals).toFixed(),
                    slippage: getCrossExchangeSlippage(this.data.slippage, route.steps.length),
                }

                bestAmount = new BigNumber(bestRoute?.bill.minExpectedAmount || 0)
            }
        }

        this.setData({
            route: bestRoute,
            routes,
        })

        this.setState('isCalculating', false)

        debug(
            'CrossPairSwapStore@calculateRightToLeft done',
            toJS(this.data),
            toJS(this.state),
        )
    }

    /**
     *
     */
    public reset(): void {
        this.setData({
            crossPairs: [],
            bill: DEFAULT_SWAP_BILL,
            leftAmount: '',
            leftToken: undefined,
            pair: undefined,
            rightAmount: '',
            rightToken: undefined,
            route: undefined,
            routes: [],
            slippage: this.data.slippage,
            transaction: undefined,
        })
        this.setState({
            isCalculating: false,
            isSwapping: false,
            isPreparing: false,
        })
    }


    /*
     * Memoized store data and state values
     * ----------------------------------------------------------------------------------
     */

    /**
     * Returns route bill amount value
     * @returns {Required<CrossPairSwapStoreData>['route']['bill']['amount']}
     */
    public get amount(): Required<CrossPairSwapStoreData>['route']['bill']['amount'] | undefined {
        return this.route?.bill.amount
    }

    /**
     * Returns route bill expected amount value
     * @returns {Required<CrossPairSwapStoreData>['route']['bill']['expectedAmount']}
     */
    public get expectedAmount(): Required<CrossPairSwapStoreData>['route']['bill']['expectedAmount'] | undefined {
        return this.route?.bill.expectedAmount
    }

    /**
     * Returns bill fee value
     * @returns {Required<CrossPairSwapStoreData>['route']['bill']['fee']}
     */
    public get fee(): Required<CrossPairSwapStoreData>['route']['bill']['fee'] | undefined {
        return this.route?.bill.fee
    }

    /**
     * Returns memoized left amount value
     * @returns {Required<CrossPairSwapStoreData>['route']['leftAmount']}
     */
    public get leftAmount(): Required<CrossPairSwapStoreData>['route']['leftAmount'] {
        return this.route?.leftAmount ?? ''
    }

    /**
     * Returns memoized right amount value
     * @returns {Required<CrossPairSwapStoreData>['route']['rightAmount']}
     */
    public get rightAmount(): Required<CrossPairSwapStoreData>['route']['rightAmount'] {
        return this.route?.rightAmount ?? ''
    }

    /**
     * Returns bill min expected amount value
     * @returns {Required<CrossPairSwapStoreData>['route']['bill']['minExpectedAmount']}
     */
    public get minExpectedAmount(): Required<CrossPairSwapStoreData>['route']['bill']['minExpectedAmount'] | undefined {
        return this.route?.bill.minExpectedAmount
    }

    /**
     * Returns bill price impact value
     * @returns {Required<CrossPairSwapStoreData>['route']['bill']['priceImpact']}
     */
    public get priceImpact(): Required<CrossPairSwapStoreData>['route']['bill']['priceImpact'] | undefined {
        return this.route?.bill.priceImpact
    }

    /**
     * Price of right token per 1 left token
     * @returns {Required<CrossPairSwapStoreData>['route']['priceLeftToRight']}
     */
    public get priceLeftToRight(): Required<CrossPairSwapStoreData>['route']['priceLeftToRight'] | undefined {
        return this.route?.priceLeftToRight
    }

    /**
     * Price of left token per 1 right token
     * @returns {Required<CrossPairSwapStoreData>['route']['priceRightToLeft']}
     */
    public get priceRightToLeft(): Required<CrossPairSwapStoreData>['route']['priceRightToLeft'] | undefined {
        return this.route?.priceRightToLeft
    }

    /**
     * Returns memoized slippage tolerance value
     * @returns {Required<CrossPairSwapStoreData>['route']['slippage']}
     */
    public get slippage(): Required<CrossPairSwapStoreData>['route']['slippage'] {
        return this.route?.slippage ?? DEFAULT_SLIPPAGE_VALUE
    }

    /**
     * Returns memoized best priced route
     * @returns {Required<CrossPairSwapStoreData>['route']}
     */
    public get route(): Required<CrossPairSwapStoreData>['route'] | undefined {
        return this.data.route
    }

    /**
     * Returns memoized list of the possible cross-tokens
     * @returns {CrossPairSwapStoreData['routes']}
     */
    public get routes(): CrossPairSwapStoreData['routes'] {
        return this.data.routes
    }

    /**
     *
     */
    public get isPreparing(): CrossPairSwapStoreState['isPreparing'] {
        return this.state.isPreparing
    }


    /*
     * Computed values
     * ----------------------------------------------------------------------------------
     */

    /**
     * Returns `true` if all data and bill is valid, otherwise `false`.
     * @returns {boolean}
     */
    public get isValid(): boolean {
        return (
            this.wallet.account?.address !== undefined
            && this.routes.length > 0
            && this.route !== undefined
            && this.leftToken?.wallet !== undefined
            && this.leftTokenAddress !== undefined
            && new BigNumber(this.amount || 0).gt(0)
            && new BigNumber(this.expectedAmount || 0).gt(0)
            && new BigNumber(this.minExpectedAmount || 0).gt(0)
            && new BigNumber(this.leftToken.balance || 0).gte(this.amount || 0)
        )
    }


    /*
     * Internal utilities methods
     * ----------------------------------------------------------------------------------
     */

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
     * Sync and update all cross-exchange pairs.
     * Fetch denominator and numerator.
     * @protected
     */
    protected async syncCrossExchangePairs(): Promise<void> {
        debug('Sync cross-pairs')

        try {
            await (
                async () => {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const pair of this.data.crossPairs) {
                        if (pair.address === undefined) {
                            break
                        }

                        if (pair.contract === undefined) {
                            pair.contract = new rpc.Contract(DexAbi.Pair, pair.address)
                        }

                        const {
                            denominator,
                            numerator,
                        } = await pair.contract.methods.getFeeParams({
                            answerId: 0,
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
        debug('Sync cross-pairs balances')

        try {
            await (
                async () => {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const pair of this.data.crossPairs) {
                        if (pair.address === undefined) {
                            break
                        }

                        if (pair.contract === undefined) {
                            pair.contract = new rpc.Contract(DexAbi.Pair, pair.address)
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
    public async syncCrossExchangePairsStates(): Promise<void> {
        debug('Sync cross-pairs states')

        try {
            const crossPairs = this.data.crossPairs.slice()

            const promises = crossPairs.map(pair => (
                rpc.getFullContractState({
                    address: pair.address!,
                })
            ))

            const states = await Promise.all(promises)

            states.forEach(({ state }, idx) => {
                crossPairs[idx] = { ...crossPairs[idx], state }
            })

            this.setData('crossPairs', crossPairs)
        }
        catch (e) {
            error('Sync cross exchange pairs states error', e)
        }
    }

    /**
     * Load pairs for each selected token.
     * Filter by TVl value which greater or equal $50000.
     * @param {string} amount
     * @param {CrossChainKind} direction
     * @protected
     */
    protected async fetchCrossPairs(
        amount: string,
        direction: CrossChainKind,
    ): Promise<NewCrossPairsResponse | undefined> {
        if (this.leftToken === undefined || this.rightToken === undefined || amount == null) {
            return undefined
        }

        const api = useSwapApi()

        try {
            return await api.newCrossPairs({}, {
                body: JSON.stringify({
                    amount,
                    deep: 3,
                    direction,
                    fromCurrencyAddress: direction === 'expectedspendamount' ? this.rightToken.root : this.leftToken.root,
                    minTvl: '50000',
                    toCurrencyAddress: direction === 'expectedspendamount' ? this.leftToken.root : this.rightToken.root,
                    whiteListCurrencies: [],
                    whiteListUri: DexConstants.TokenListURI,
                } as NewCrossPairsRequest),
            })
        }
        catch (e) {
            error('Load selected tokens cross-pairs error', e)
            return undefined
        }
    }

    /**
     * Internal swap transaction subscriber
     * @type {Subscriber}
     * @protected
     */
    #transactionSubscriber: Subscriber | undefined

}
