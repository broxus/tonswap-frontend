import BigNumber from 'bignumber.js'
import type { IReactionDisposer } from 'mobx'
import {
    action, computed, makeObservable, override, reaction,
} from 'mobx'

import { DexConstants } from '@/misc'
import { BaseSwapStore } from '@/modules/Swap/stores/BaseSwapStore'
import { CoinSwapStore } from '@/modules/Swap/stores/CoinSwapStore'
import { ConversionStore } from '@/modules/Swap/stores/ConversionStore'
import { CrossPairSwapStore } from '@/modules/Swap/stores/CrossPairSwapStore'
import { DirectSwapStore } from '@/modules/Swap/stores/DirectSwapStore'
import { MultipleSwapStore } from '@/modules/Swap/stores/MultipleSwapStore'
import type {
    BaseSwapStoreData,
    CoinSwapSuccessResult,
    ConversionTransactionResponse,
    CrossPairSwapFailureResult,
    CrossPairSwapStoreData,
    DirectSwapStoreData,
    DirectTransactionSuccessResult,
    SwapFormStoreState,
    SwapOptions,
    SwapPair,
} from '@/modules/Swap/types'
import { SwapDirection, SwapExchangeMode } from '@/modules/Swap/types'
import { getCrossExchangeSlippage, getSlippageMinExpectedAmount } from '@/modules/Swap/utils'
import type { WalletNativeCoin } from '@/stores/WalletService'
import { useWallet, WalletService } from '@/stores/WalletService'
import { TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import {
    cleanObject, debounce, debug, formattedBalance, isGoodBignumber, storage, warn,
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
            wrapFee: options?.wrapGas,
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
            coin: this.coin,
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
            coin: this.coin,
            leftAmount: this.data.leftAmount,
            leftToken: this.data.leftToken,
            rightAmount: this.data.rightAmount,
            rightToken: this.data.rightToken,
            slippage: this.data.slippage,
            swapFee: options?.multipleSwapFee,
        }, {
            onTransactionSuccess: (...args) => this.handleCoinSwapSuccess(...args),
            onTransactionFailure: (...args) => this.handleSwapFailure(...args),
        })

        this.#coinSwap = new CoinSwapStore(wallet, tokensCache, {
            coin: this.coin,
            leftAmount: this.data.leftAmount,
            leftToken: this.data.leftToken,
            rightAmount: this.data.rightAmount,
            rightToken: this.data.rightToken,
            slippage: this.data.slippage,
            swapFee: options?.multipleSwapFee,
        }, {
            onTransactionSuccess: (...args) => this.handleCoinSwapSuccess(...args),
            onTransactionFailure: (...args) => this.handleSwapFailure(...args),
        })

        makeObservable<
            SwapFormStore,
            | 'handleWalletAccountChange'
            | 'handleSwapSuccess'
            | 'handleSwapFailure'
            | 'handleConversionSuccess'
            | '_swap'
        >(this, {
            maximizeLeftAmount: action.bound,
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
            isLeftAmountValid: override,
            coin: computed,
            leftBalance: override,
            pair: computed,
            rightBalance: override,
            route: computed,
            swap: computed,
            conversion: computed,
            useWallet: computed,
            handleWalletAccountChange: action.bound,
            handleSwapSuccess: action.bound,
            handleSwapFailure: action.bound,
            handleConversionSuccess: action.bound,
            _swap: computed,
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
            coin: this.coin,
            directBill: {
                amount: this._swap.amount || this._swap.leftAmount || this.leftAmount,
                expectedAmount: this._swap.expectedAmount,
                fee: this._swap.fee,
                minExpectedAmount: this._swap.minExpectedAmount,
                priceImpact: this._swap.priceImpact,
            },
            leftToken: this.data.leftToken,
            rightToken: this.data.rightToken,
            slippage: this.data.slippage,
        }), ({ directBill, ...formData }) => {
            this.#crossPairSwap.setData(cleanObject({ ...formData, directBill }))
            this.#coinSwap.setData(cleanObject({ ...formData, bill: directBill }))
            this.#directSwap.setData(cleanObject({ ...formData, bill: directBill }))
            this.#multipleSwap.setData(cleanObject({ ...formData, bill: directBill }))
        }, { fireImmediately: true })

        this.#tokensCacheDisposer = reaction(
            () => this.tokensCache.isReady,
            async isReady => {
                if (isReady && this.data.leftToken !== undefined && this.data.rightToken !== undefined) {
                    await this.recalculate(true)
                }
            },
            { fireImmediately: true },
        )
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

    public async submit(): Promise<void> {
        switch (true) {
            case this.isCrossExchangeMode:
                await this.#crossPairSwap.submit()
                break

            case this.isMultipleSwapMode && this.#multipleSwap.isEnoughTokenBalance:
                await this.#directSwap.submit()
                break

            case this.isMultipleSwapMode && this.#multipleSwap.isEnoughCoinBalance:
                await this.#coinSwap.submit('fromCoinToTip3')
                break

            case this.isMultipleSwapMode:
                await this.#multipleSwap.submit()
                break

            case this.nativeCoinSide === 'leftToken':
                await this.#coinSwap.submit('fromCoinToTip3')
                break

            case this.nativeCoinSide === 'rightToken':
                await this.#coinSwap.submit('fromTip3ToCoin')
                break

            default:
                await this.#directSwap.submit()
        }
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
        this.#coinSwap.setData('leftAmount', value)
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
        this.#coinSwap.setData('rightAmount', value)
        this.#crossPairSwap.setData('rightAmount', value)
        this.#directSwap.setData('rightAmount', value)
        this.#multipleSwap.setData('rightAmount', value)
    }

    /**
     * Force pair update through all internal stores
     * @param {SwapPair} value
     */
    public forcePairUpdate(value: SwapPair | undefined): void {
        this.#coinSwap.setData('pair', value)
        this.#crossPairSwap.setData('pair', value)
        this.#directSwap.setData('pair', value)
        this.#multipleSwap.setData('pair', value)
    }

    public forceLeftTokenUpdate(value?: string): void {
        this.setData('leftToken', value)
        this.#coinSwap.setData('leftToken', value)
        this.#crossPairSwap.setData('leftToken', value)
        this.#directSwap.setData('leftToken', value)
        this.#multipleSwap.setData('leftToken', value)
    }

    public forceRightTokenUpdate(value?: string): void {
        this.setData('rightToken', value)
        this.#coinSwap.setData('rightToken', value)
        this.#crossPairSwap.setData('rightToken', value)
        this.#directSwap.setData('rightToken', value)
        this.#multipleSwap.setData('rightToken', value)
    }

    /**
     *
     */
    public async maximizeLeftAmount(): Promise<void> {
        let balance = this.leftBalance

        if (this.isMultipleSwapMode) {
            balance = new BigNumber(this.leftBalance || 0)
                .minus(new BigNumber(this.options?.multipleSwapFee ?? 0).shiftedBy(-this.coin.decimals))
                .toFixed()
        }

        if (this.isWrapMode) {
            balance = new BigNumber(this.leftBalance || 0)
                .minus(new BigNumber(this.options?.wrapGas ?? 0).shiftedBy(-this.coin.decimals))
                .toFixed()
        }
        else if (this.nativeCoinSide === 'leftToken') {
            balance = new BigNumber(this.leftBalance || 0)
                .minus(new BigNumber(this.options?.multipleSwapFee ?? 0).shiftedBy(-this.coin.decimals))
                .toFixed()
        }

        await this.changeLeftAmount(balance, debounce(async () => {
            if (this.isConversionMode) {
                this.forceRightAmountUpdate(this.leftAmount)
            }
            else {
                await this.recalculate(!this.isCalculating)
            }
        }, 400))
    }

    /**
     * Use this method to change left amount value instead of direct change value via `setData`
     * Pass the callback function as second argument (e.g. debounced `recalculate`) and
     * it will be fires after all data and states changes.
     * @param {string} value
     * @param {() => void} [callback]
     */
    public changeLeftAmount(value: string, callback?: () => void): void {
        if (value === this.data.leftAmount) {
            return
        }

        this.setState('direction', SwapDirection.LTR)
        this.forceLeftAmountUpdate(value)

        if (value.length === 0) {
            this.forceRightAmountUpdate('')
            this.forceInvalidate()
            if (this._swap.pair !== undefined && !this._swap.isLowTvl) {
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
        if (value === this.data.rightAmount) {
            return
        }

        this.setState('direction', SwapDirection.RTL)
        this.forceRightAmountUpdate(value)

        if (value.length === 0) {
            this.forceLeftAmountUpdate('')
            this.forceInvalidate()
            if (this._swap.pair !== undefined && !this._swap.isLowTvl) {
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

        const isReverting = root === this.data.rightToken && !this.isConversionMode

        if (isReverting) {
            this.setData({
                leftAmount: this.rightAmount,
                leftToken: root,
                rightAmount: '',
                rightToken: this.data.leftToken,
            })
            this.forceLeftAmountUpdate(this.leftAmount)
            this.forceRightAmountUpdate('')
            this.setState('direction', SwapDirection.LTR)
        }
        else {
            this.forcePairUpdate(undefined)
            this.setData('leftToken', root)
            this.forceRightAmountUpdate('')
            this.#crossPairSwap.setData('routes', [])
        }

        this.forceLeftTokenUpdate(this.data.leftToken)
        this.forceRightTokenUpdate(this.data.rightToken)

        this.forceInvalidate()

        callback?.()

        if (this.data.leftToken === undefined || this.data.rightToken === undefined) {
            this.forcePairUpdate(undefined)
            await this.trackData()
            return
        }

        if (this.pair === undefined && !this._swap.isPairChecking) {
            await this._swap.prepare()
            this.forcePairUpdate(this._swap.pair)
        }

        if (!(this.isMultipleSwapMode || this.isCoinBasedSwapMode)) {
            await this.#crossPairSwap.prepare()
        }

        debug('Change left token. Stores data', this, this._swap, this.#crossPairSwap)

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
        if (root === undefined) {
            return
        }

        const isReverting = root === this.data.leftToken && !this.isConversionMode

        if (isReverting) {
            this.setData({
                leftAmount: '',
                leftToken: this.data.rightToken,
                rightAmount: this.leftAmount,
                rightToken: root,
            })
            this.setState('direction', SwapDirection.RTL)
            this.forceLeftAmountUpdate('')
            this.forceRightAmountUpdate(this.rightAmount)
        }
        else {
            this.forcePairUpdate(undefined)
            this.setData('rightToken', root)
            this.forceLeftAmountUpdate('')
            this.#crossPairSwap.setData('routes', [])
        }

        this.forceLeftTokenUpdate(this.data.leftToken)
        this.forceRightTokenUpdate(this.data.rightToken)

        this.forceInvalidate()

        callback?.()

        if (this.leftToken === undefined || this.rightToken === undefined) {
            this.forcePairUpdate(undefined)
            await this.trackData()
            return
        }

        if (this.pair === undefined && !this._swap.isPairChecking) {
            await this._swap.prepare()
            this.forcePairUpdate(this._swap.pair)
        }

        if (!(this.isMultipleSwapMode || this.isCoinBasedSwapMode)) {
            await this.#crossPairSwap.prepare()
        }

        debug('Change right token. Stores data', this, this._swap, this.#crossPairSwap)

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

            if (this._swap.expectedAmount !== undefined) {
                // @ts-ignore
                this._swap.setData('bill', {
                    amount: this._swap.amount,
                    expectedAmount:  this._swap.expectedAmount,
                    fee:  this._swap.fee,
                    minExpectedAmount: getSlippageMinExpectedAmount(
                        new BigNumber(this._swap.expectedAmount || 0),
                        value,
                    ).toFixed(),
                    priceImpact:  this._swap.priceImpact,
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
            direction: SwapDirection.LTR,
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

        debug('Toggle direction. Stores data', this, this._swap, this.#crossPairSwap)

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

        this.setState('isCalculating', true)

        if (this.direction === SwapDirection.LTR && !this.leftAmountNumber.isZero()) {
            await this._swap.calculateLeftToRight(force)

            if (this.isCrossExchangeAvailable && (!(this.isMultipleSwapMode || this.isCoinBasedSwapMode))) {
                await this.#crossPairSwap.calculateLeftToRight(force)
            }
        }
        else if (this.direction === SwapDirection.RTL && !this.rightAmountNumber.isZero()) {
            await this._swap.calculateRightToLeft(force)

            if (this.isCrossExchangeAvailable && (!(this.isMultipleSwapMode || this.isCoinBasedSwapMode))) {
                await this.#crossPairSwap.calculateRightToLeft(force, this.isEnoughLiquidity)
            }
        }

        setTimeout(() => {
            this.forceLeftAmountUpdate(this.swap.leftAmount || this.leftAmount)
            this.forceRightAmountUpdate(this.swap.rightAmount || this.rightAmount)
        }, 0)

        this.setState('isCalculating', false)

        if (!this.isCrossExchangeOnly) {
            this.checkExchangeMode()
        }

        debug('Recalculated. Stores data', this, this._swap, this.#crossPairSwap)

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

    public get isCoinBasedSwapMode(): boolean {
        return this.nativeCoinSide !== undefined
    }

    /**
     * Returns `true` if liquidity in direct pair is enough
     * @returns {boolean}
     */
    public get isEnoughLiquidity(): boolean {
        return this._swap.isEnoughLiquidity
    }

    /**
     *
     * @returns {boolean}
     */
    public get isLowTvl(): boolean {
        return this._swap.isLowTvl
    }

    /**
     * Returns combined `isLoading` state from direct swap, cross-pair swap.
     * @returns {boolean}
     */
    public get isLoading(): boolean {
        return this._swap.isPairChecking || this.#crossPairSwap.isPreparing
    }

    /**
     * Returns combined `isSwapping` state from direct swap, cross-pair swap.
     * @returns {boolean}
     */
    public get isSwapping(): boolean {
        return this._swap.isSwapping || this.#crossPairSwap.isSwapping || this.#conversion.isProcessing
    }

    /**
     *
     */
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

        if (this.leftAmount.length === 0) {
            return true
        }

        if (this.nativeCoinSide === 'leftToken') {
            const balance = new BigNumber(this.coin.balance || 0).shiftedBy(-this.coin.decimals)
            const fee = new BigNumber(this.options?.multipleSwapFee ?? 0).shiftedBy(-this.coin.decimals)
            return isGoodBignumber(this.leftAmountNumber, false) && balance.minus(fee).gte(this.leftAmount || 0)
        }

        const balance = new BigNumber(this.leftToken?.balance || 0).shiftedBy(-this.leftTokenDecimals)
        return isGoodBignumber(this.leftAmountNumber, false) && balance.gte(this.leftAmount || 0)
    }

    /**
     *
     */
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

    public get leftBalance(): string {
        if (this.isMultipleSwapMode) {
            return formattedBalance(this.leftToken?.balance, this.leftTokenDecimals, this.coin.balance)
        }

        if (this.nativeCoinSide === 'leftToken') {
            return formattedBalance(this.coin.balance, this.coin.decimals)
        }

        return formattedBalance(this.leftToken?.balance, this.leftTokenDecimals)
    }

    /**
     * Returns memoized current direct pair
     * Proxy to direct swap store instance
     * @returns {DirectSwapStoreData['pair']}
     */
    public get pair(): DirectSwapStoreData['pair'] {
        return this._swap.pair
    }

    public get rightBalance(): string {
        if (this.nativeCoinSide === 'rightToken') {
            return formattedBalance(this.coin.balance, this.coin.decimals)
        }

        return formattedBalance(this.rightToken?.balance, this.rightTokenDecimals)
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
     * @requires {DirectSwapStore | MultipleSwapStore | CoinSwapStore | CrossPairSwapStore}
     */
    public get swap(): DirectSwapStore | MultipleSwapStore | CoinSwapStore | CrossPairSwapStore {
        switch (true) {
            case this.isCrossExchangeMode:
                return this.#crossPairSwap

            default:
                return this._swap
        }
    }

    /**
     * Returns related conversion store
     * @returns {ConversionStore}
     */
    public get conversion(): ConversionStore {
        return this.#conversion
    }

    /**
     * Returns related multi swap store
     * @returns {MultipleSwapStore}
     */
    public get multipleSwap(): MultipleSwapStore {
        return this.#multipleSwap
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
    protected checkExchangeMode(): void {
        switch (true) {
            case this.pair === undefined && this.route !== undefined:
            case this.route !== undefined && this.isLowTvl:
                this.setState('exchangeMode', SwapExchangeMode.CROSS_PAIR_EXCHANGE_ONLY)
                break

            case this.isMultipleSwapMode:
                this.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
                break

            case this.nativeCoinSide === 'leftToken' && this.rightToken?.root === this.multipleSwapTokenRoot:
                this.setState('exchangeMode', SwapExchangeMode.WRAP_EVER)
                break

            case this.nativeCoinSide === 'rightToken' && this.leftToken?.root === this.multipleSwapTokenRoot:
                this.setState('exchangeMode', SwapExchangeMode.WRAP_EVER)
                break

            case (!this.isEnoughLiquidity || this.pair === undefined) && this.route !== undefined:
                this.setState('exchangeMode', SwapExchangeMode.CROSS_PAIR_EXCHANGE)
                break

            default:
                this.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
        }
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
     * @param {DirectTransactionSuccessResult['input']} input
     * @param {DirectTransactionSuccessResult['transaction']} transaction
     * @protected
     */
    protected async handleSwapSuccess({ input, transaction }: DirectTransactionSuccessResult): Promise<void> {
        this.forceLeftAmountUpdate('')
        this.forceRightAmountUpdate('')

        this.setData('transaction', {
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
        })

        this.checkExchangeMode()
        this.forceInvalidate()

        await this._swap.syncPairState()
        await this.trackData()

        if (!this.isMultipleSwapMode) {
            await this.#crossPairSwap.syncCrossExchangePairsStates()
        }
    }

    /**
     * Failure transaction callback handler
     * @param {CrossPairSwapFailureResult['index']} index
     * @param {CrossPairSwapFailureResult['input']} input
     * @param {CrossPairSwapFailureResult['step']} step
     * @protected
     */
    protected handleSwapFailure({ cancelStep, index, step }: CrossPairSwapFailureResult): void {
        const leftToken = cancelStep?.step.spentAddress !== undefined
            ? this.tokensCache.get(cancelStep.step.spentAddress.toString())
            : undefined
        const rightToken = cancelStep?.step.receiveAddress !== undefined
            ? this.tokensCache.get(cancelStep.step.receiveAddress.toString())
            : undefined

        this.setData('transaction', {
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
        })

        this.checkExchangeMode()
        this.forceInvalidate()
    }

    protected async handleCoinSwapSuccess({ input, transaction }: CoinSwapSuccessResult): Promise<void> {
        this.forceLeftAmountUpdate('')
        this.forceRightAmountUpdate('')

        this.setData('transaction', {
            amount: input.amount.toString(),
            hash: transaction.id.hash,
            receivedDecimals: this.rightTokenDecimals,
            receivedIcon: this.rightToken?.icon,
            receivedRoot: this.rightToken?.root,
            receivedSymbol: this.rightToken?.symbol,
            success: true,
        })

        this.checkExchangeMode()
        this.forceInvalidate()

        await this._swap.syncPairState()

        if (!this.isMultipleSwapMode) {
            await this.#crossPairSwap.syncCrossExchangePairsStates()
        }
    }

    /**
     *
     * @param {ConversionTransactionResponse} _
     * @protected
     */
    protected handleConversionSuccess(_: ConversionTransactionResponse): void {
        this.forceLeftAmountUpdate('')
        this.forceRightAmountUpdate('')
    }

    /*
     * Private swap stores instances
     * ----------------------------------------------------------------------------------
     */

    private get _swap(): DirectSwapStore | CoinSwapStore | MultipleSwapStore {
        switch (true) {
            case this.nativeCoinSide !== undefined:
                return this.#coinSwap

            case this.isMultipleSwapMode:
                return this.#multipleSwap

            default:
                return this.#directSwap
        }
    }

    /**
     *
     * @private
     */
    readonly #coinSwap: CoinSwapStore

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
    readonly #directSwap: DirectSwapStore

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
                wrapGas: DexConstants.EVERWrapGas,
            },
        )
    }
    return store
}
