import BigNumber from 'bignumber.js'
import { Address } from 'everscale-inpage-provider'
import { computed, makeObservable } from 'mobx'

import { DEFAULT_DECIMALS } from '@/modules/Swap/constants'
import { BaseStore } from '@/stores/BaseStore'
import { TokenCache, TokensCacheService } from '@/stores/TokensCacheService'
import { formattedBalance, isGoodBignumber } from '@/utils'
import type {
    BaseSwapStoreData,
    BaseSwapStoreInitialData,
    BaseSwapStoreState,
} from '@/modules/Swap/types'


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
            leftAmount: initialData?.leftAmount,
            leftToken: initialData?.leftToken,
            rightAmount: initialData?.rightAmount,
            rightToken: initialData?.rightToken,
            slippage: initialData?.slippage ?? '0.5',
        })

        this.setState({
            isCalculating: false,
            isSwapping: false,
        })

        makeObservable<
            BaseSwapStore<T, U>,
            | 'leftAmountNumber'
            | 'leftTokenAddress'
            | 'rightTokenAddress'
            | 'rightAmountNumber'
        >(this, {
            leftAmount: computed,
            leftAmountNumber: computed,
            leftBalance: computed,
            leftToken: computed,
            leftTokenAddress: computed,
            leftTokenDecimals: computed,
            rightAmount: computed,
            rightAmountNumber: computed,
            rightBalance: computed,
            rightToken: computed,
            rightTokenAddress: computed,
            rightTokenDecimals: computed,
            slippage: computed,
            transaction: computed,
            isCalculating: computed,
            isLeftAmountValid: computed,
            isRightAmountValid: computed,
            isSwapping: computed,
        })
    }


    /*
     * Memoized store data and state values
     * ----------------------------------------------------------------------------------
     */

    /**
     * Returns memoized left amount value
     * @returns {BaseSwapStoreData['leftAmount']}
     */
    public get leftAmount(): BaseSwapStoreData['leftAmount'] {
        return this.data.leftAmount
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
     * Returns `true` if left amount value is valid, otherwise `false`.
     * NOTE: Use it only in UI for determining field validation and
     * DON'T USE it in internal calculations or validations
     * @returns {boolean}
     */
    public get isLeftAmountValid(): boolean {
        if (this.leftAmount.length === 0) {
            return true
        }
        return this.leftAmount.length > 0 && isGoodBignumber(this.leftAmountNumber, false)
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
     * Returns left amount BigNumber unshifted by the left token decimals
     * @returns {BigNumber}
     * @protected
     */
    public get leftAmountNumber(): BigNumber {
        return new BigNumber(this.data.leftAmount)
            .shiftedBy(this.leftTokenDecimals)
            .dp(0, BigNumber.ROUND_DOWN)
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
     * Returns right amount BigNumber unshifted by the right token decimals
     * @returns {BigNumber}
     * @protected
     */
    protected get rightAmountNumber(): BigNumber {
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

    public get leftBalance(): string {
        return formattedBalance(this.leftToken?.balance, this.leftTokenDecimals)
    }

    public get rightBalance(): string {
        return formattedBalance(this.rightToken?.balance, this.rightTokenDecimals)
    }

}
