import BigNumber from 'bignumber.js'
import type { IReactionDisposer } from 'mobx'
import {
    action,
    computed,
    makeObservable,
    override,
    reaction,
} from 'mobx'

import { DexConstants } from '@/misc'
import {
    DEFAULT_LEFT_TOKEN_ROOT,
    DEFAULT_RIGHT_TOKEN_ROOT,
    DEFAULT_SLIPPAGE_VALUE,
    DEFAULT_SWAP_BILL,
} from '@/modules/Swap/constants'
import { BaseSwapStore } from '@/modules/Swap/stores/BaseSwapStore'
import { CoinSwapStore } from '@/modules/Swap/stores/CoinSwapStore'
import { ConversionStore } from '@/modules/Swap/stores/ConversionStore'
import { CrossPairSwapStore } from '@/modules/Swap/stores/CrossPairSwapStore'
import { DirectSwapStore } from '@/modules/Swap/stores/DirectSwapStore'
import { MultipleSwapStore } from '@/modules/Swap/stores/MultipleSwapStore'
import type {
    CoinSwapSuccessResult,
    ConversionTransactionResponse,
    CrossPairSwapFailureResult,
    CrossPairSwapStoreData,
    DirectTransactionSuccessResult,
    SwapFormStoreData,
    SwapFormStoreState,
    SwapOptions,
} from '@/modules/Swap/types'
import { SwapDirection, SwapExchangeMode } from '@/modules/Swap/types'
import { getCrossExchangeSlippage, getSlippageMinExpectedAmount } from '@/modules/Swap/utils'
import type { WalletNativeCoin } from '@/stores/WalletService'
import { useWallet, WalletService } from '@/stores/WalletService'
import { TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import {
    debounce,
    debug,
    formattedBalance,
    isGoodBignumber,
    storage,
} from '@/utils'


export class SwapFormStore extends BaseSwapStore<SwapFormStoreData, SwapFormStoreState> {

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly options?: SwapOptions,
    ) {
        super(tokensCache)

        this.setData({
            leftAmount: '',
            rightAmount: '',
            slippage: storage.get('slippage') || DEFAULT_SLIPPAGE_VALUE,
        })

        this.setState({
            direction: SwapDirection.LTR,
            exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
            isConfirmationAwait: false,
            isPreparing: false,
            priceDirection: SwapDirection.LTR,
        })

        this.#conversion = new ConversionStore(wallet, tokensCache, {
            coin: this.coin,
            safeAmount: options?.multipleSwapFee,
            token: options?.multipleSwapTokenRoot,
            wrapGas: options?.wrapGas,
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
            | 'currentSwap'
        >(this, {
            maximizeLeftAmount: action.bound,
            toggleSwapExchangeMode: action.bound,
            togglePriceDirection: action.bound,
            cleanTransactionResult: action.bound,
            priceLeftToRight: override,
            priceRightToLeft: override,
            direction: computed,
            exchangeMode: computed,
            nativeCoinSide: computed,
            priceDirection: computed,
            isConfirmationAwait: computed,
            isMultipleSwapMode: computed,
            multipleSwapTokenRoot: computed,
            isCalculating: override,
            isCrossExchangeAvailable: computed,
            isCrossExchangeMode: computed,
            isCrossExchangeOnly: computed,
            isConversionMode: computed,
            isPreparing: computed,
            isWrapMode: computed,
            isUnwrapMode: computed,
            isLoading: computed,
            isLeftAmountValid: override,
            coin: computed,
            formattedLeftBalance: override,
            formattedRightBalance: override,
            leftBalanceNumber: computed,
            route: computed,
            swap: computed,
            conversion: computed,
            useWallet: computed,
            handleWalletAccountChange: action.bound,
            handleSwapSuccess: action.bound,
            handleSwapFailure: action.bound,
            handleConversionSuccess: action.bound,
            currentSwap: computed,
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
            bill: this.data.bill,
            coin: this.coin,
            leftAmount: this.data.leftAmount,
            leftToken: this.data.leftToken,
            pair: this.data.pair,
            rightAmount: this.data.rightAmount,
            rightToken: this.data.rightToken,
            slippage: this.data.slippage,
        }), formData => {
            this.#crossPairSwap.setData(formData)
            this.#conversion.setData({
                amount: formData.leftAmount,
                coin: formData.coin,
                token: this.multipleSwapTokenRoot,
            })
            this.#coinSwap.setData(formData)
            this.#directSwap.setData(formData)
            this.#multipleSwap.setData(formData)
        }, { fireImmediately: true })

        this.#tokensCacheDisposer = reaction(
            () => this.tokensCache.isReady,
            async isReady => {
                if (this.wallet.isConnected && isReady) {
                    if (this.data.leftToken !== undefined && this.data.rightToken !== undefined) {
                        await this.recalculate(true)
                    }
                    else if (this.data.leftToken === undefined && this.data.rightToken === undefined) {
                        this.setData({
                            leftToken: DEFAULT_LEFT_TOKEN_ROOT,
                            rightToken: DEFAULT_RIGHT_TOKEN_ROOT,
                        })
                        this.setState('isMultiple', true)
                    }
                    await Promise.all([
                        this.data.leftToken && this.tokensCache.syncToken(this.data.leftToken),
                        this.data.rightToken && this.tokensCache.syncToken(this.data.rightToken),
                    ])
                    await this.changeLeftToken(this.leftToken?.root)
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

    /**
     * Submit transaction dispatcher
     */
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
            exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
            isConfirmationAwait: false,
            priceDirection: SwapDirection.LTR,
        })
        this.#directSwap.reset()
        this.#coinSwap.reset()
        this.#multipleSwap.reset()
        this.#crossPairSwap.reset()
    }

    /**
     * Maximizing the value of the left field depending on the form mode
     */
    public async maximizeLeftAmount(): Promise<void> {
        let balance = this.leftBalanceNumber

        if (this.isMultipleSwapMode || this.isWrapMode || this.nativeCoinSide === 'leftToken') {
            balance = balance.minus(new BigNumber(this.options?.multipleSwapFee || 0).shiftedBy(-this.coin.decimals))
        }

        if (!isGoodBignumber(balance)) {
            balance = new BigNumber(0)
        }

        await this.changeLeftAmount(balance.toFixed(), debounce(async () => {
            if (this.isConversionMode) {
                this.setData('rightAmount', this.leftAmount)
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
        this.setState('direction', SwapDirection.LTR)

        this.forceInvalidate()

        this.setData('leftAmount', value)

        if (value.length === 0) {
            this.setData('rightAmount', '')
            if (this.pair !== undefined && !this.isLowTvl) {
                this.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
            }
        }

        callback?.()

        if (!this.isEnoughLiquidity) {
            this.setData('rightAmount', '')
        }
    }

    /**
     * Use this method to change right amount value instead of direct change value via `setData`
     * Pass the callback function as second argument (e.g. debounced `recalculate`) and
     * it will be fires after all data and states changes.
     * @param {string} value
     * @param {() => void} [callback]
     */
    public changeRightAmount(value: string, callback?: () => void): void {
        this.setState('direction', SwapDirection.RTL)

        this.forceInvalidate()

        this.setData('rightAmount', value)

        if (value.length === 0) {
            this.setData('leftAmount', '')
            if (this.pair !== undefined && !this.isLowTvl) {
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
        if (!this.wallet.isConnected || root === undefined) {
            return
        }

        const isReverting = root === this.data.rightToken && !this.isConversionMode

        if (isReverting) {
            this.setData({
                leftToken: root,
                rightToken: this.data.leftToken,
            })
            this.setState('direction', SwapDirection.LTR)
        }
        else {
            this.setData({
                leftToken: root,
                pair: undefined,
            })
            this.#crossPairSwap.setData('routes', [])
            if (this.direction === SwapDirection.LTR) {
                this.setData('rightAmount', '')
            }
            else if (this.direction === SwapDirection.RTL) {
                this.setData('leftAmount', '')
            }
        }

        this.forceInvalidate()

        callback?.()

        if (this.data.leftToken === undefined || this.data.rightToken === undefined) {
            this.setData('pair', undefined)
            return
        }

        if (this.pair === undefined && !this.currentSwap.isPairChecking) {
            await this.prepare()
        }

        this.checkExchangeMode()

        // if (!(this.isMultipleSwapMode || this.isCoinBasedSwapMode)) {
        //     await this.#crossPairSwap.prepare()
        // }

        debug('Change left token. Stores data', this, this.currentSwap, this.#crossPairSwap)

        await this.recalculate(!this.isCalculating)
    }

    /**
     * Use this method to change right token root value instead of direct change value via `setData`
     * Pass the callback function as second argument, and it will be fires after all data and
     * states changes and before run recalculation.
     * @param {string} [root]
     * @param {() => void} [callback]
     */
    public async changeRightToken(root?: string, callback?: () => void): Promise<void> {
        if (!this.wallet.isConnected || root === undefined) {
            return
        }

        const isReverting = root === this.data.leftToken && !this.isConversionMode

        if (isReverting) {
            this.setData({
                // leftAmount: '',
                leftToken: this.data.rightToken,
                // rightAmount: this.leftAmount,
                rightToken: root,
            })
            this.setState('direction', SwapDirection.RTL)
        }
        else {
            this.setData({
                pair: undefined,
                rightToken: root,
            })
            this.#crossPairSwap.setData('routes', [])
            if (this.direction === SwapDirection.LTR) {
                this.setData('rightAmount', '')
            }
            else if (this.direction === SwapDirection.RTL) {
                this.setData('leftAmount', '')
            }
        }

        this.forceInvalidate()

        callback?.()

        if (this.leftToken === undefined || this.rightToken === undefined) {
            this.setData('pair', undefined)
            return
        }

        if (this.pair === undefined && !this.isPairChecking) {
            await this.prepare()
        }

        this.checkExchangeMode()

        // if (!(this.isMultipleSwapMode || this.isCoinBasedSwapMode)) {
        //     await this.#crossPairSwap.prepare()
        // }

        debug('Change right token. Stores data', this, this.currentSwap, this.#crossPairSwap)

        await this.recalculate(!this.isCalculating)
    }

    /**
     * Use this method to change slippage value instead of direct change value via `setData`
     * It will save value to localStorage and runs recalculation for cross-pair exchange if needed
     * @param {string} value
     */
    public async changeSlippage(value: string): Promise<void> {
        if (value !== this.slippage) {
            this.setData('slippage', value)
            storage.set('slippage', value)

            if (this.isCrossExchangeMode) {
                this.#crossPairSwap.setData('route', undefined)
                await this.recalculate(!this.isCalculating)
            }

            if (this.currentSwap.expectedAmount !== undefined) {
                // @ts-ignore
                this.currentSwap.setData('bill', {
                    amount: this.currentSwap.amount,
                    expectedAmount:  this.currentSwap.expectedAmount,
                    fee:  this.currentSwap.fee,
                    minExpectedAmount: getSlippageMinExpectedAmount(
                        new BigNumber(this.currentSwap.expectedAmount || 0),
                        value,
                    ).toFixed(),
                    priceImpact: this.currentSwap.priceImpact,
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

        this.setState({
            direction: this.direction === SwapDirection.RTL ? SwapDirection.LTR : SwapDirection.RTL,
            nativeCoinSide: this.nativeCoinSide && (this.nativeCoinSide === 'leftToken' ? 'rightToken' : 'leftToken'),
        })

        debug('Toggle direction. Stores data', this, this.currentSwap, this.#crossPairSwap)

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
        if (!this.wallet.isConnected) {
            return
        }

        if (!force && this.isCalculating) {
            return
        }

        this.setState('isCalculating', true)

        if (this.direction === SwapDirection.LTR && isGoodBignumber(this.leftAmountNumber)) {
            if (this.pair?.address !== undefined && !this.isCrossExchangeOnly) {
                await this.calculateLeftToRight(force)
            }

            if ((!(this.isMultipleSwapMode || this.isCoinBasedSwapMode))) {
                await this.#crossPairSwap.checkSuggestions(this.leftAmountNumber.toFixed(), 'expectedexchange')
                await this.#crossPairSwap.calculateLeftToRight(force)
            }
        }
        else if (this.direction === SwapDirection.RTL && isGoodBignumber(this.rightAmountNumber)) {
            if (this.pair?.address !== undefined && !this.isCrossExchangeOnly) {
                await this.calculateRightToLeft(force)
            }

            if ((!(this.isMultipleSwapMode || this.isCoinBasedSwapMode))) {
                await this.#crossPairSwap.checkSuggestions(this.rightAmountNumber.toFixed(), 'expectedspendamount')
                await this.#crossPairSwap.calculateRightToLeft(force, this.isEnoughLiquidity)
            }
        }
        else {
            this.finalizeCalculation()
        }

        this.setState('isCalculating', false)

        if (!this.isCrossExchangeOnly) {
            this.checkExchangeMode()
        }

        debug('Recalculated. Stores data', this, this.currentSwap, this.#crossPairSwap)
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
     * Price of right token per 1 left token
     * @returns {BaseSwapStoreData['priceLeftToRight']}
     */
    public get priceLeftToRight(): SwapFormStoreData['priceLeftToRight'] {
        if (this.isCrossExchangeMode) {
            return this.crossPairSwap.priceLeftToRight
        }
        return this.isLowTvl ? undefined : this.data.priceLeftToRight
    }

    /**
     * Price of left token per 1 right token
     * @returns {BaseSwapStoreData['priceRightToLeft']}
     */
    public get priceRightToLeft(): SwapFormStoreData['priceRightToLeft'] {
        if (this.isCrossExchangeMode) {
            return this.crossPairSwap.priceRightToLeft
        }
        return this.isLowTvl ? undefined : this.data.priceRightToLeft
    }

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
     * Returns memoized preparing state value
     * @returns {SwapFormStoreState['isPreparing']}
     */
    public get isPreparing(): SwapFormStoreState['isPreparing'] {
        return this.state.isPreparing
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

    public get isCalculating(): boolean {
        return this.state.isCalculating || this.swap.isCalculating || this.crossPairSwap.isCalculating
    }

    /**
     * Returns `true` if cross-pair exchange is available for current pair.
     * @returns {boolean}
     */
    public get isCrossExchangeAvailable(): boolean {
        return this.crossPairSwap.routes.length > 0
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
     *
     */
    public get isCoinBasedSwapMode(): boolean {
        return this.nativeCoinSide !== undefined
    }

    /**
     * Returns combined `isLoading` state from direct swap, cross-pair swap.
     * @returns {boolean}
     */
    public get isLoading(): boolean {
        return this.tokensCache.isFetching || this.isPairChecking || this.crossPairSwap.isPreparing
    }

    /**
     * Returns combined `isSwapping` state from direct swap, cross-pair swap.
     * @returns {boolean}
     */
    public get isSwapping(): boolean {
        return (
            this.#coinSwap.isSwapping
            || this.#conversion.isProcessing
            || this.#crossPairSwap.isSwapping
            || this.#directSwap.isSwapping
            || this.#multipleSwap.isSwapping
        )
    }

    /**
     * Returns `true` if left amount value is valid, otherwise `false`.
     * NOTE: Use it only in UI for determining field validation and
     * DON'T USE it in internal calculations or validations
     * @returns {boolean}
     */
    public get isLeftAmountValid(): boolean {
        if (this.isCrossExchangeMode && this.direction === SwapDirection.RTL) {
            const leftAmountNumber = new BigNumber(this.crossPairSwap.route?.leftAmount || 0)
            return (
                isGoodBignumber(leftAmountNumber, false)
                && this.leftBalanceNumber.gte(leftAmountNumber.shiftedBy(-this.leftTokenDecimals))
            )
        }

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
            const fee = new BigNumber(this.options?.multipleSwapFee ?? 0).shiftedBy(-this.coin.decimals)
            return (
                isGoodBignumber(this.leftAmountNumber, false)
                && this.wallet.balanceNumber.minus(fee).gte(this.leftAmountNumber.shiftedBy(-this.leftTokenDecimals))
            )
        }

        return (
            isGoodBignumber(this.leftAmountNumber, false)
            && this.leftBalanceNumber.gte(this.leftAmountNumber.shiftedBy(-this.leftTokenDecimals))
        )
    }

    /**
     * Returns `true` if right amount value is valid, otherwise `false`.
     * NOTE: Use it only in UI for determining field validation and
     * DON'T USE it in internal calculations or validations
     * @returns {boolean}
     * todo: check liquidity across all pairs in route
     */
    public get isRightAmountValid(): boolean {
        if (
            this.swap.rightAmount.length > 0
            && !this.isCrossExchangeMode
            && !this.isConversionMode
        ) {
            return this.isEnoughLiquidity
        }
        return true
    }

    /**
     * Returns `true` if all data and bill is valid, otherwise `false`.
     * @returns {boolean}
     */
    public get isValid(): boolean {
        switch (true) {
            case this.isWrapMode:
                return this.conversion.isWrapValid

            case this.isUnwrapMode:
                return this.conversion.isWrapValid

            case this.isCrossExchangeMode:
                return this.crossPairSwap.isValid

            case this.isMultipleSwapMode:
                return (
                    this.isEnoughLiquidity
                    && (
                        this.multipleSwap.isEnoughTokenBalance
                        || this.multipleSwap.isEnoughCoinBalance
                        || this.multipleSwap.isEnoughCombinedBalance
                    )
                    && this.wallet.account?.address !== undefined
                    && this.pair?.address !== undefined
                    && this.pair?.contract !== undefined
                    && this.leftToken?.wallet !== undefined
                    && this.leftTokenAddress !== undefined
                    && isGoodBignumber(this.multipleSwap.amount || 0)
                    && isGoodBignumber(this.multipleSwap.expectedAmount || 0)
                    && isGoodBignumber(this.multipleSwap.minExpectedAmount || 0)
                )

            case this.nativeCoinSide === 'leftToken':
                return this.#coinSwap.isValidCoinToTip3

            case this.nativeCoinSide === 'rightToken':
                return this.#coinSwap.isValidTip3ToCoin

            default:
                return (
                    this.isEnoughLiquidity
                    && this.wallet.account?.address !== undefined
                    && this.pair?.address !== undefined
                    && this.pair?.contract !== undefined
                    && this.leftToken?.wallet !== undefined
                    && this.leftTokenAddress !== undefined
                    && new BigNumber(this.amount || 0).gt(0)
                    && new BigNumber(this.expectedAmount || 0).gt(0)
                    && new BigNumber(this.minExpectedAmount || 0).gt(0)
                    && new BigNumber(this.leftToken.balance || 0).gte(this.amount || 0)
                )
        }
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
     *
     */
    public get formattedLeftBalance(): string {
        return formattedBalance(this.leftBalanceNumber.toFixed())
    }

    /**
     *
     */
    public get formattedRightBalance(): string {
        if (this.nativeCoinSide === 'rightToken') {
            return formattedBalance(this.coin.balance, this.coin.decimals)
        }

        return formattedBalance(this.rightToken?.balance, this.rightTokenDecimals)
    }

    /**
     *
     */
    public get leftBalanceNumber(): BigNumber {
        const balance = new BigNumber(this.leftToken?.balance || 0).shiftedBy(-this.leftTokenDecimals)

        if (this.isMultipleSwapMode) {
            return balance.plus(this.wallet.balanceNumber)
        }

        if (this.nativeCoinSide === 'leftToken') {
            return this.wallet.balanceNumber
        }

        return balance
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
                return this.currentSwap
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
     * Returns related cross-pair swap store
     * @returns {CrossPairSwapStore}
     */
    public get crossPairSwap(): CrossPairSwapStore {
        return this.#crossPairSwap
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
        this.setData('bill', DEFAULT_SWAP_BILL)
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
            case (this.pair === undefined || this.isLowTvl) && this.isCrossExchangeAvailable:
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
            debug('Store data. Reconnect', this, this.swap, this.#crossPairSwap)
            await this.init()
            await Promise.all([
                this.data.leftToken && this.tokensCache.syncToken(this.data.leftToken),
                this.data.rightToken && this.tokensCache.syncToken(this.data.rightToken),
            ])
            this.setData({
                leftToken: this.leftToken?.root,
                rightToken: this.rightToken?.root,
            })
            await this.changeLeftToken(this.leftToken?.root)
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

        this.checkExchangeMode()
        this.forceInvalidate()

        await this.currentSwap.syncPairState()

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

    /**
     *
     * @param input
     * @param transaction
     * @protected
     */
    protected async handleCoinSwapSuccess({ input, transaction }: CoinSwapSuccessResult): Promise<void> {
        this.setData({
            leftAmount: '',
            rightAmount: '',
            transaction: {
                amount: input.amount.toString(),
                hash: transaction.id.hash,
                receivedDecimals: this.nativeCoinSide === 'rightToken' ? this.coin.decimals : this.rightTokenDecimals,
                receivedIcon: this.nativeCoinSide === 'rightToken' ? this.coin.icon : this.rightToken?.icon,
                receivedRoot: this.nativeCoinSide === 'rightToken' ? undefined : this.rightToken?.root,
                receivedSymbol: this.nativeCoinSide === 'rightToken' ? this.coin.symbol : this.rightToken?.symbol,
                success: true,
            },
        })

        this.checkExchangeMode()
        this.forceInvalidate()

        await this.currentSwap.syncPairState()

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
        this.setData({
            leftAmount: '',
            rightAmount: '',
        })
    }

    /*
     * Private swap stores instances
     * ----------------------------------------------------------------------------------
     */

    private get currentSwap(): DirectSwapStore | CoinSwapStore | MultipleSwapStore {
        switch (true) {
            case this.isCoinBasedSwapMode:
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
