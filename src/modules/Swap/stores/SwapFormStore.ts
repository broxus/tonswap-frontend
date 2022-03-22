import BigNumber from 'bignumber.js'
import type { IReactionDisposer } from 'mobx'
import {
    action,
    computed,
    makeObservable,
    reaction,
} from 'mobx'

import { useBalanceValidation } from '@/hooks/useBalanceValidation'
import { DexConstants } from '@/misc'
import { DEFAULT_LEFT_TOKEN_ROOT, DEFAULT_RIGHT_TOKEN_ROOT } from '@/modules/Swap/constants'
import { BaseSwapStore } from '@/modules/Swap/stores/BaseSwapStore'
import { ConversionStore } from '@/modules/Swap/stores/ConversionStore'
import { CrossPairSwapStore } from '@/modules/Swap/stores/CrossPairSwapStore'
import { DirectSwapStore } from '@/modules/Swap/stores/DirectSwapStore'
import { MultipleSwapStore } from '@/modules/Swap/stores/MultipleSwapStore'
import type {
    BaseSwapStoreData,
    ConversionTransactionResponse,
    CrossPairSwapStoreData,
    DirectSwapStoreData,
    DirectSwapStoreState,
    SwapFailureResult,
    SwapFormStoreState,
    SwapOptions,
    SwapPair,
    SwapSuccessResult,
} from '@/modules/Swap/types'
import { SwapDirection, SwapExchangeMode } from '@/modules/Swap/types'
import { getCrossExchangeSlippage, getSlippageMinExpectedAmount } from '@/modules/Swap/utils'
import type { WalletNativeCoin } from '@/stores/WalletService'
import { useWallet, WalletService } from '@/stores/WalletService'
import { TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import {
    cleanObject,
    debug,
    isGoodBignumber,
    storage,
    warn,
} from '@/utils'


export class SwapFormStore extends BaseSwapStore<BaseSwapStoreData, SwapFormStoreState> {

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly options?: SwapOptions,
    ) {
        super(tokensCache)

        this.setData({
            leftAmount: '',
            rightAmount: '',
            slippage: storage.get('slippage') || '0.5',
        })

        this.setState({
            direction: SwapDirection.LTR,
            exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
            isCalculating: false,
            isConfirmationAwait: false,
            priceDirection: SwapDirection.LTR,
        })

        this.#conversion = new ConversionStore(wallet, tokensCache, {
            coin: this.coin,
            token: options?.multipleSwapTokenRoot,
            wrapFee: options?.wrapFee,
        }, {
            onTransactionSuccess: (...args) => this.handleConversionSuccess(...args),
        })

        this.#crossPairSwap = new CrossPairSwapStore(wallet, tokensCache, {
            leftAmount: this.data.leftAmount,
            leftToken: this.data.leftToken,
            rightAmount: this.data.rightAmount,
            rightToken: this.data.rightToken,
            slippage: this.data.slippage,
        }, {
            onTransactionSuccess: (...args) => this.handleSwapSuccess(...args),
            onTransactionFailure: (...args) => this.handleSwapFailure(...args),
        })

        this.#directSwap = new DirectSwapStore(wallet, tokensCache, {
            leftAmount: this.data.leftAmount,
            leftToken: this.data.leftToken,
            rightAmount: this.data.rightAmount,
            rightToken: this.data.rightToken,
            slippage: this.data.slippage,
        }, {
            onTransactionSuccess: (...args) => this.handleSwapSuccess(...args),
            onTransactionFailure: (...args) => this.handleSwapFailure(...args),
        })

        this.#multipleSwap = new MultipleSwapStore(wallet, tokensCache, {
            leftAmount: this.data.leftAmount,
            leftToken: this.data.leftToken,
            rightAmount: this.data.rightAmount,
            rightToken: this.data.rightToken,
            slippage: this.data.slippage,
        }, {
            onTransactionSuccess: (...args) => this.handleSwapSuccess(...args),
            onTransactionFailure: (...args) => this.handleSwapFailure(...args),
        })

        makeObservable<
            SwapFormStore,
            | 'directSwap'
            | 'handleWalletAccountChange'
            | 'handleSwapSuccess'
            | 'handleSwapFailure'
            | 'handleConversionSuccess'
        >(this, {
            toggleSwapExchangeMode: action.bound,
            togglePriceDirection: action.bound,
            cleanTransactionResult: action.bound,
            direction: computed,
            exchangeMode: computed,
            nativeCoinSide: computed,
            priceDirection: computed,
            isConfirmationAwait: computed,
            isMultipleSwapMode: computed,
            multipleSwapTokenRoot: computed,
            isCrossExchangeAvailable: computed,
            isCrossExchangeMode: computed,
            isCrossExchangeOnly: computed,
            isConversionMode: computed,
            isWrapMode: computed,
            isUnwrapMode: computed,
            isEnoughLiquidity: computed,
            isLowTvl: computed,
            isLoading: computed,
            coin: computed,
            pair: computed,
            route: computed,
            swap: computed,
            conversion: computed,
            useWallet: computed,
            handleWalletAccountChange: action.bound,
            handleSwapSuccess: action.bound,
            handleSwapFailure: action.bound,
            handleConversionSuccess: action.bound,
            directSwap: computed,
        })
    }

    /*
     * Public actions. Useful in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     * Manually initiate store.
     * Run all necessary subscribers.
     */
    public async init(): Promise<void> {
        this.#walletAccountDisposer?.()
        this.#walletAccountDisposer = reaction(
            () => this.wallet.address,
            this.handleWalletAccountChange,
        )

        if (this.wallet.account === undefined) {
            return
        }

        this.#formDisposer = reaction(() => ({
            directBill: {
                amount: this.directSwap.amount || this.directSwap.leftAmount,
                expectedAmount: this.directSwap.expectedAmount || '0',
            },
            leftToken: this.data.leftToken,
            pair: this.pair,
            rightToken: this.data.rightToken,
            slippage: this.data.slippage,
        }), ({ directBill, pair, ...formData }) => {
            this.#crossPairSwap.setData(cleanObject({ ...formData, directBill, pair }))
            // todo pass pair by the is multiple
            this.#directSwap.setData(cleanObject(formData))
            this.#multipleSwap.setData(cleanObject(formData))
        }, { fireImmediately: true })

        this.#tokensCacheDisposer = reaction(
            () => this.tokensCache.tokens.length,
            async (value, prevValue) => {
                if (value !== prevValue && value > 0) {
                    if (this.direction === SwapDirection.LTR) {
                        await this.changeLeftToken(this.data.leftToken)
                    }
                    else if (this.direction === SwapDirection.RTL) {
                        await this.changeRightToken(this.data.rightToken)
                    }
                }
            },
            { fireImmediately: true },
        )

        if (this.data.leftToken === undefined && this.data.rightToken === undefined) {
            this.setData('rightToken', DEFAULT_RIGHT_TOKEN_ROOT)
            this.setState('isMultiple', true)
            await this.changeLeftToken(DEFAULT_LEFT_TOKEN_ROOT)
        }
    }

    /**
     * Manually dispose all the internal subscribers.
     * Clean last transaction result, intervals
     * and reset all data to their defaults.
     * @param {boolean} disposeWallet
     */
    public async dispose(disposeWallet: boolean = true): Promise<void> {
        this.#formDisposer?.()
        this.#tokensCacheDisposer?.()
        if (disposeWallet) {
            this.#walletAccountDisposer?.()
        }
        this.reset()
    }

    /**
     * Full reset direct, cross-pair and multiple swap
     * instances to their default.
     * @protected
     */
    protected reset(): void {
        this.setData({
            leftAmount: '',
            rightAmount: '',
            transaction: undefined,
        })
        this.setState({
            direction: SwapDirection.LTR,
            isConfirmationAwait: false,
            priceDirection: SwapDirection.LTR,
        })
        this.#directSwap.reset()
        this.#multipleSwap.reset()
        this.#crossPairSwap.reset()
    }

    /**
     * Force left amount update through all internal stores
     * @param {string} value
     */
    public forceLeftAmountUpdate(value: string): void {
        this.setData('leftAmount', value)
        this.#conversion.setData('amount', value)
        this.#crossPairSwap.setData('leftAmount', value)
        this.#directSwap.setData('leftAmount', value)
        this.#multipleSwap.setData('leftAmount', value)
    }

    /**
     * Force right amount update through all internal stores
     * @param {string} value
     */
    public forceRightAmountUpdate(value: string): void {
        this.setData('rightAmount', value)
        this.#crossPairSwap.setData('rightAmount', value)
        this.#directSwap.setData('rightAmount', value)
        this.#multipleSwap.setData('rightAmount', value)
    }

    /**
     * Force pair update through all internal stores
     * @param {SwapPair} value
     */
    public forcePairUpdate(value: SwapPair | undefined): void {
        this.#crossPairSwap.setData('pair', value)
        this.#directSwap.setData('pair', value)
        this.#multipleSwap.setData('pair', value)
    }

    /**
     * Use this method to change left amount value instead of direct change value via `setData`
     * Pass the callback function as second argument (e.g. debounced `recalculate`) and
     * it will be fires after all data and states changes.
     * @param {string} value
     * @param {() => void} [callback]
     */
    public changeLeftAmount(value: string, callback?: () => void): void {
        if (this.isConversionMode) {
            this.forceLeftAmountUpdate(value)
            this.forceRightAmountUpdate(value)
            return
        }

        if (value === this.data.leftAmount) {
            return
        }

        this.setState('direction', SwapDirection.LTR)
        this.forceLeftAmountUpdate(value)

        if (value.length === 0) {
            this.forceRightAmountUpdate('')
            this.forceInvalidate()
            if (this.directSwap.pair !== undefined && !this.directSwap.isLowTvl) {
                this.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
            }
        }

        callback?.()
    }

    /**
     * Use this method to change right amount value instead of direct change value via `setData`
     * Pass the callback function as second argument (e.g. debounced `recalculate`) and
     * it will be fires after all data and states changes.
     * @param {string} value
     * @param {() => void} [callback]
     */
    public changeRightAmount(value: string, callback?: () => void): void {
        if (this.isConversionMode) {
            this.forceRightAmountUpdate(value)
            this.forceLeftAmountUpdate(value)
            return
        }

        if (value === this.data.rightAmount) {
            return
        }

        this.setState('direction', SwapDirection.RTL)
        this.forceRightAmountUpdate(value)

        if (value.length === 0) {
            this.forceLeftAmountUpdate('')
            this.forceInvalidate()
            if (this.directSwap.pair !== undefined && !this.directSwap.isLowTvl) {
                this.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
            }
        }

        callback?.()
    }

    /**
     * Use this method to change left token root value instead of direct change value via `setData`.
     * Pass the callback function as second argument, and it will be fires after all data and
     * states changes and before run recalculation.
     * @param {string} [root]
     * @param {() => void} [callback]
     */
    public async changeLeftToken(root?: string, callback?: () => void): Promise<void> {
        if (root === undefined) {
            return
        }

        const isReverting = root === this.data.rightToken

        if (isReverting) {
            this.setData({
                leftAmount: this.rightAmount,
                leftToken: root,
                rightAmount: '',
                rightToken: this.data.leftToken,
            })
            this.setState('direction', SwapDirection.LTR)
        }
        else {
            this.forcePairUpdate(undefined)
            this.setData('leftToken', root)
        }

        this.forceInvalidate()

        if (this.isConversionMode) {
            this.setData('rightToken', undefined)
        }

        callback?.()

        if (this.data.leftToken === undefined || this.data.rightToken === undefined) {
            this.forcePairUpdate(undefined)
            return
        }

        if (this.pair === undefined && !this.directSwap.isPairChecking) {
            await this.directSwap.prepare()
        }

        await this.#crossPairSwap.prepare()

        debug('Change left token. Stores data', this, this.directSwap, this.#crossPairSwap)

        await this.recalculate(!this.isCalculating)
        await this.trackData()
    }

    /**
     * Use this method to change right token root value instead of direct change value via `setData`
     * Pass the callback function as second argument, and it will be fires after all data and
     * states changes and before run recalculation.
     * @param {string} [root]
     * @param {() => void} [callback]
     */
    public async changeRightToken(root?: string, callback?: () => void): Promise<void> {
        const isReverting = root === this.data.leftToken

        if (isReverting) {
            this.setData({
                leftAmount: '',
                leftToken: this.data.rightToken,
                rightAmount: this.leftAmount,
                rightToken: root,
            })
            this.setState('direction', SwapDirection.RTL)
        }
        else {
            this.forcePairUpdate(undefined)
            this.setData('rightToken', root)
        }

        this.forceInvalidate()

        if (this.isConversionMode) {
            this.setData('leftToken', undefined)
        }

        callback?.()

        if (this.leftToken === undefined || this.rightToken === undefined) {
            this.forcePairUpdate(undefined)
            return
        }

        if (this.pair === undefined && !this.directSwap.isPairChecking) {
            await this.directSwap.prepare()
        }

        await this.#crossPairSwap.prepare()

        debug('Change right token. Stores data', this, this.directSwap, this.#crossPairSwap)

        await this.recalculate(!this.isCalculating)
        await this.trackData()
    }

    /**
     * Use this method to change slippage value instead of direct change value via `setData`
     * It will save value to localStorage and runs recalculation for cross-pair exchange if needed
     * @param {string} value
     */
    public async changeSlippage(value: string): Promise<void> {
        if (value !== this.data.slippage && isGoodBignumber(new BigNumber(value || 0))) {
            this.setData('slippage', value)
            storage.set('slippage', value)

            if (this.isCrossExchangeMode) {
                this.#crossPairSwap.setData('route', undefined)
                await this.recalculate(!this.isCalculating)
            }

            if (this.directSwap.expectedAmount !== undefined) {
                this.directSwap.setData('bill', {
                    amount: this.directSwap.amount,
                    expectedAmount:  this.directSwap.expectedAmount,
                    fee:  this.directSwap.fee,
                    minExpectedAmount: getSlippageMinExpectedAmount(
                        new BigNumber(this.directSwap.expectedAmount || 0),
                        value,
                    ).toFixed(),
                    priceImpact:  this.directSwap.priceImpact,
                })
            }
        }
    }

    /**
     * Manually toggle conversion direction.
     * Revert amounts, tokens, exchange mode and native coin side
     */
    public async toggleConversionDirection(): Promise<void> {
        if (this.isLoading || this.isSwapping) {
            return
        }

        this.setData({
            leftToken: this.data.rightToken,
            rightToken: this.data.leftToken,
        })

        this.setState({
            exchangeMode: this.exchangeMode === SwapExchangeMode.WRAP_EVER
                ? SwapExchangeMode.UNWRAP_WEVER
                : SwapExchangeMode.WRAP_EVER,
            nativeCoinSide: this.nativeCoinSide && (this.nativeCoinSide === 'leftToken' ? 'rightToken' : 'leftToken'),
        })
    }

    /**
     * Manually toggle exchange direction.
     * Reset swap bill. Revert prices, amounts and tokens.
     */
    public async toggleDirection(): Promise<void> {
        if (this.isLoading || this.isSwapping) {
            return
        }

        this.setData({
            leftAmount: this.data.rightAmount,
            leftToken: this.data.rightToken,
            rightAmount: this.data.leftAmount,
            rightToken: this.data.leftToken,
        })

        this.forceLeftAmountUpdate(this.data.leftAmount)
        this.forceRightAmountUpdate(this.data.rightAmount)

        this.setState({
            direction: this.direction === SwapDirection.RTL ? SwapDirection.LTR : SwapDirection.RTL,
            nativeCoinSide: this.nativeCoinSide && (this.nativeCoinSide === 'leftToken' ? 'rightToken' : 'leftToken'),
        })

        debug('Toggle direction. Stores data', this, this.directSwap, this.#crossPairSwap)

        this.forceInvalidate()

        await this.recalculate(!this.isCalculating)
    }

    /**
     * Manually toggle price direction.
     */
    public togglePriceDirection(): void {
        this.setState(
            'priceDirection',
            this.priceDirection === SwapDirection.LTR
                ? SwapDirection.RTL
                : SwapDirection.LTR,
        )
    }

    /**
     * Manually toggle exchange mode.
     */
    public toggleSwapExchangeMode(): void {
        if (!this.isCrossExchangeMode && this.isCrossExchangeAvailable) {
            this.setState('exchangeMode', SwapExchangeMode.CROSS_PAIR_EXCHANGE)
            return
        }
        this.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
    }

    /**
     * Manually recalculate exchange bill by current direction.
     * @param {boolean} [force]
     * @protected
     */
    public async recalculate(force: boolean = false): Promise<void> {
        if (!force && this.isCalculating) {
            return
        }

        if (this.pair?.address === undefined && !this.isCrossExchangeAvailable) {
            return
        }

        // if (
        //     (this.direction === SwapDirection.LTR && this.leftAmountNumber.isZero())
        //     || (this.direction === SwapDirection.RTL && this.rightAmountNumber.isZero())
        // ) {
        //     this.directSwap.forceInvalidate()
        //     this.finalizeCalculation()
        //     return
        // }

        this.setState('isCalculating', true)

        if (this.direction === SwapDirection.LTR && !this.leftAmountNumber.isZero()) {
            await this.directSwap.calculateLeftToRight(force)

            if (this.isCrossExchangeAvailable) {
                await this.#crossPairSwap.calculateLeftToRight(force)
            }
        }
        else if (this.direction === SwapDirection.RTL && !this.rightAmountNumber.isZero()) {
            await this.directSwap.calculateRightToLeft(force)

            if (this.isCrossExchangeAvailable) {
                await this.#crossPairSwap.calculateRightToLeft(force)
            }
        }

        this.finalizeCalculation()

        this.setState('isCalculating', false)

        this.checkCrossExchange()

        debug('Recalculated. Stores data', this, this.directSwap, this.#crossPairSwap)

    }

    /**
     * Manually clean last transaction receipt result.
     */
    public cleanTransactionResult(): void {
        this.setData('transaction', undefined)
    }


    /*
     * Memoized store data and state values
     * ----------------------------------------------------------------------------------
     */

    /**
     * Returns memoized swap direction value
     * @returns {SwapFormStoreState['direction']}
     */
    public get direction(): SwapFormStoreState['direction'] {
        return this.state.direction
    }

    /**
     * Returns memoized exchange mode value
     * @returns {SwapFormStoreState['exchangeMode']}
     */
    public get exchangeMode(): SwapFormStoreState['exchangeMode'] {
        return this.state.exchangeMode
    }

    /**
     * Returns memoized native coin side value
     * @returns {SwapFormStoreState['nativeCoinSide']}
     */
    public get nativeCoinSide(): SwapFormStoreState['nativeCoinSide'] {
        return this.state.nativeCoinSide
    }

    /**
     * Returns memoized price direction value
     * @returns {SwapFormStoreState['priceDirection']}
     */
    public get priceDirection(): SwapFormStoreState['priceDirection'] {
        return this.state.priceDirection
    }

    /**
     * Returns memoized swap confirmation await state value
     * @returns {SwapFormStoreState['isConfirmationAwait']}
     */
    public get isConfirmationAwait(): SwapFormStoreState['isConfirmationAwait'] {
        return this.state.isConfirmationAwait
    }

    /**
     * Returns memoized multiple swap mode state value
     * @returns {SwapFormStoreState['isMultiple']}
     */
    public get isMultipleSwapMode(): SwapFormStoreState['isMultiple'] {
        return this.state.isMultiple
    }

    /**
     * Returns memoized multiple swap token root value
     * @returns {SwapOptions['multipleSwapTokenRoot']}
     */
    public get multipleSwapTokenRoot(): SwapOptions['multipleSwapTokenRoot'] {
        return this.options?.multipleSwapTokenRoot
    }


    /*
     * Computed values
     * ----------------------------------------------------------------------------------
     */

    /**
     * Returns `true` if cross-pair exchange is available for current pair.
     * @returns {boolean}
     */
    public get isCrossExchangeAvailable(): boolean {
        return this.#crossPairSwap.routes.length > 0
    }

    /**
     * Returns `true` if cross-pair swap exchange mode is enabled.
     * @returns {boolean}
     */
    public get isCrossExchangeMode(): boolean {
        return [
            SwapExchangeMode.CROSS_PAIR_EXCHANGE,
            SwapExchangeMode.CROSS_PAIR_EXCHANGE_ONLY,
        ].includes(this.exchangeMode)
    }

    /**
     * Returns `true` if only cross-exchange available, otherwise `false`.
     * @returns {boolean}
     */
    public get isCrossExchangeOnly(): boolean {
        return this.exchangeMode === SwapExchangeMode.CROSS_PAIR_EXCHANGE_ONLY
    }

    /**
     * Returns `true` if native coin is selected
     * @returns {boolean}
     */
    public get isConversionMode(): boolean {
        return [
            SwapExchangeMode.WRAP_EVER,
            SwapExchangeMode.UNWRAP_WEVER,
        ].includes(this.exchangeMode)
    }

    /**
     *
     */
    public get isWrapMode(): boolean {
        return this.exchangeMode === SwapExchangeMode.WRAP_EVER
    }

    /**
     *
     */
    public get isUnwrapMode(): boolean {
        return this.exchangeMode === SwapExchangeMode.UNWRAP_WEVER
    }

    /**
     * Returns `true` if liquidity in direct pair is enough
     * @returns {boolean}
     */
    public get isEnoughLiquidity(): boolean {
        return this.directSwap.isEnoughLiquidity
    }

    /**
     *
     * @returns {boolean}
     */
    public get isLowTvl(): boolean {
        return this.directSwap.isLowTvl
    }

    /**
     * Returns combined `isLoading` state from direct swap, cross-pair swap.
     * @returns {boolean}
     */
    public get isLoading(): boolean {
        return this.directSwap.isPairChecking || this.#crossPairSwap.isPreparing
    }

    /**
     * Returns combined `isSwapping` state from direct swap, cross-pair swap.
     * @returns {boolean}
     */
    public get isSwapping(): boolean {
        return this.directSwap.isSwapping || this.#crossPairSwap.isSwapping || this.conversion.isProcessing
    }

    public get isLeftAmountValid(): boolean {
        if (this.isWrapMode) {
            return this.#conversion.isWrapAmountValid
        }

        if (this.isUnwrapMode) {
            return this.#conversion.isUnwrapAmountValid
        }

        if (this.isMultipleSwapMode) {
            return this.#multipleSwap.isLeftAmountValid
        }

        return useBalanceValidation(
            this.leftToken,
            this.swap.leftAmount,
        )
    }

    public get isRightAmountValid(): boolean {
        if (this.swap.rightAmount.length > 0 && !this.isCrossExchangeMode && !this.isConversionMode) {
            return this.isEnoughLiquidity
        }
        return true
    }

    /**
     * Returns wallet native coin
     * Proxy to wallet service
     * @returns {WalletNativeCoin}
     */
    public get coin(): WalletNativeCoin {
        return this.wallet.coin
    }

    /**
     * Returns memoized current direct pair
     * Proxy to direct swap store instance
     * @returns {DirectSwapStoreData['pair']}
     */
    public get pair(): DirectSwapStoreData['pair'] {
        return this.directSwap.pair
    }

    /**
     * Returns memoized best priced route
     * Proxy to cross-pair swap store instance
     * @returns {CrossPairSwapStoreData['pair']}
     */
    public get route(): CrossPairSwapStoreData['route'] {
        return this.#crossPairSwap.route
    }

    /**
     * Returns current swap way upon exchange mode
     * @requires {DirectSwapStore | CrossPairSwapStore}
     */
    public get swap(): DirectSwapStore<DirectSwapStoreData, DirectSwapStoreState> | CrossPairSwapStore {
        switch (true) {
            case this.isCrossExchangeMode:
                return this.#crossPairSwap

            case this.isMultipleSwapMode:
            default:
                return this.directSwap
        }
    }

    /**
     * Returns related conversion store
     * @returns {ConversionStore}
     */
    public get conversion(): ConversionStore {
        return this.#conversion
    }


    /*
     * Internal and external utilities methods
     * ----------------------------------------------------------------------------------
     */

    /**
     * Invalidate partial data of the internal stores
     */
    public forceInvalidate(): void {
        this.#crossPairSwap.forceInvalidate()
        this.#directSwap.forceInvalidate()
        this.#multipleSwap.forceInvalidate()
    }

    /**
     * Returns related tokens cache service
     * @returns {TokensCacheService}
     */
    public get useTokensCache(): TokensCacheService {
        return this.tokensCache
    }

    /**
     * Returns related wallet service
     * @returns {WalletService}
     */
    public get useWallet(): WalletService {
        return this.wallet
    }

    /**
     * Checks if we should be toggled to cross-exchange mode.
     * Toggle to cross-exchange mode if:
     * - direct pair token doesn't exist or exists, but pool haven't enough liquidity
     * - cross-exchange is available - has 1 or more routes and has best route
     * @protected
     */
    protected checkCrossExchange(): void {
        switch (true) {
            case this.isMultipleSwapMode:
                this.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
                break

            case this.nativeCoinSide === 'leftToken' && this.rightToken?.root === this.multipleSwapTokenRoot:
                this.setState('exchangeMode', SwapExchangeMode.WRAP_EVER)
                break

            case this.nativeCoinSide === 'rightToken' && this.leftToken?.root === this.multipleSwapTokenRoot:
                this.setState('exchangeMode', SwapExchangeMode.WRAP_EVER)
                break

            case this.pair === undefined && this.route !== undefined:
            case this.route !== undefined && this.isLowTvl:
                this.setState('exchangeMode', SwapExchangeMode.CROSS_PAIR_EXCHANGE_ONLY)
                break

            case (!this.isEnoughLiquidity || this.pair === undefined) && this.route !== undefined:
                this.setState('exchangeMode', SwapExchangeMode.CROSS_PAIR_EXCHANGE)
                break

            default:
                this.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
        }
    }

    /**
     *
     * @protected
     */
    protected finalizeCalculation(): void {
        this.setData({
            leftAmount: this.swap.leftAmount ?? this.leftAmount,
            rightAmount: this.swap.rightAmount ?? this.rightAmount,
        })
    }

    /**
     * Unsubscribe, subscribe tokens balance updates.
     * todo: Sync pair data and run recalculate
     * @protected
     */
    protected async trackData(): Promise<void> {
        try {
            await Promise.all([
                this.data.leftToken && this.tokensCache.unwatch(this.data.leftToken, 'swap-field'),
                this.data.rightToken && this.tokensCache.unwatch(this.data.rightToken, 'swap-field'),
            ])
            await Promise.all([
                this.data.leftToken && this.tokensCache.watch(this.data.leftToken, 'swap-field'),
                this.data.rightToken && this.tokensCache.watch(this.data.rightToken, 'swap-field'),
            ])
        }
        catch (e) {
            warn(e)
        }
    }


    /*
     * Reactions handlers
     * ----------------------------------------------------------------------------------
     */

    /**
     * Handle wallet account change.
     * @param {string} [walletAddress]
     * @protected
     */
    protected async handleWalletAccountChange(walletAddress?: string): Promise<void> {
        await this.dispose(false)
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
    protected async handleSwapSuccess({ input, transaction }: SwapSuccessResult): Promise<void> {
        this.setData({
            leftAmount: '',
            rightAmount: '',
            transaction: {
                amount: input.result.received.toString(),
                hash: transaction.id.hash,
                receivedDecimals: this.rightTokenDecimals,
                receivedIcon: this.rightToken?.icon,
                receivedRoot: this.rightToken?.root,
                receivedSymbol: this.rightToken?.symbol,
                spentAmount: input.result.spent.toString(),
                spentDecimals: this.leftTokenDecimals,
                spentFee: input.result.fee.toString(),
                spentSymbol: this.leftToken?.symbol,
                success: true,
            },
        })

        this.directSwap.setState('isSwapping', false)
        this.#crossPairSwap.setState('isSwapping', false)

        this.checkCrossExchange()
        this.forceInvalidate()

        await this.directSwap.syncPairState()
        await this.#crossPairSwap.syncCrossExchangePairsStates()
    }

    /**
     * Failure transaction callback handler
     * @param {SwapSuccessResult['index']} index
     * @param {SwapSuccessResult['input']} input
     * @param {SwapSuccessResult['step']} step
     * @protected
     */
    protected handleSwapFailure({ cancelStep, index, step }: SwapFailureResult): void {
        const leftToken = cancelStep?.step.spentAddress !== undefined
            ? this.tokensCache.get(cancelStep.step.spentAddress.toString())
            : undefined
        const rightToken = cancelStep?.step.receiveAddress !== undefined
            ? this.tokensCache.get(cancelStep.step.receiveAddress.toString())
            : undefined

        this.setData({
            transaction:  {
                amount: step?.amount,
                hash: cancelStep?.transaction?.id.hash,
                isCrossExchangeCanceled: step !== undefined,
                receivedDecimals: rightToken?.decimals,
                receivedRoot: rightToken?.root,
                receivedSymbol: rightToken?.symbol,
                slippage: index !== undefined
                    ? getCrossExchangeSlippage(
                        this.#crossPairSwap.slippage,
                        index + 1,
                    )
                    : undefined,
                spentDecimals: leftToken?.decimals,
                spentIcon: leftToken?.icon,
                spentRoot: leftToken?.root,
                spentSymbol: leftToken?.symbol,
                success: false,
            },
        })

        this.directSwap.setState('isSwapping', false)
        this.#crossPairSwap.setState('isSwapping', false)

        this.checkCrossExchange()
        this.forceInvalidate()

        this.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
    }

    protected handleConversionSuccess(_: ConversionTransactionResponse): void {
        this.forceLeftAmountUpdate('')
        this.forceRightAmountUpdate('')
    }

    /*
     * Private swap stores instances
     * ----------------------------------------------------------------------------------
     */

    private get directSwap(): DirectSwapStore<DirectSwapStoreData, DirectSwapStoreState> {
        return this.isMultipleSwapMode ? this.#multipleSwap : this.#directSwap
    }

    /**
     *
     * @private
     */
    readonly #conversion: ConversionStore

    /**
     *
     * @private
     */
    readonly #crossPairSwap: CrossPairSwapStore

    /**
     *
     * @private
     */
    readonly #directSwap: DirectSwapStore<DirectSwapStoreData, DirectSwapStoreState>

    /**
     *
     * @private
     */
    readonly #multipleSwap: MultipleSwapStore


    /*
     * Internal reaction disposers
     * ----------------------------------------------------------------------------------
     */

    #formDisposer: IReactionDisposer | undefined

    #tokensCacheDisposer: IReactionDisposer | undefined

    #walletAccountDisposer: IReactionDisposer | undefined

}


let store: SwapFormStore

export function useSwapFormStore(): SwapFormStore {
    if (store === undefined) {
        store = new SwapFormStore(
            useWallet(),
            useTokensCache(),
            {
                multipleSwapFee: DexConstants.EVERMultipleSwapFee,
                multipleSwapTokenRoot: DexConstants.WEVERRootAddress.toString(),
                useNativeCoinByDefault: true,
                wrapFee: DexConstants.EVERWrapFee,
            },
        )
    }
    return store
}
