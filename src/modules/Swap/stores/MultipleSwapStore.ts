import BigNumber from 'bignumber.js'
import { computed, makeObservable, override } from 'mobx'

import { CoinSwapStore } from '@/modules/Swap/stores/CoinSwapStore'
import { TokensCacheService } from '@/stores/TokensCacheService'
import { WalletService } from '@/stores/WalletService'
import { isGoodBignumber } from '@/utils'
import type {
    CoinSwapStoreInitialData,
    SwapTransactionCallbacks,
} from '@/modules/Swap/types'


export class MultipleSwapStore extends CoinSwapStore {

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly initialData?: CoinSwapStoreInitialData,
        protected readonly callbacks?: SwapTransactionCallbacks<any, any>,
    ) {
        super(wallet, tokensCache, initialData)

        makeObservable(this, {
            combinedBalanceNumber: computed,
            isEnoughTokenBalance: computed,
            isEnoughCoinBalance: override,
            isLeftAmountValid: override,
            isValid: override,
        })
    }

    public async submit(): Promise<void> {
        console.log('MultipleSwapStore@submit', this)
    }

    protected async swapCoinAndTokenToTip3(): Promise<void> {
        console.log('MultipleSwapStore@swapCoinAndTokenToTip3', this)
    }

    public get combinedBalanceNumber(): BigNumber {
        const tokenBalance = new BigNumber(this.leftToken?.balance ?? 0).shiftedBy(-this.leftTokenDecimals)
        const coinBalance = new BigNumber(this.coin.balance ?? 0).shiftedBy(-this.coin.decimals)
        return tokenBalance.plus(coinBalance).dp(Math.min(this.leftTokenDecimals, this.coin.decimals))
    }

    public get isEnoughTokenBalance(): boolean {
        const balance = new BigNumber(this.leftToken?.balance ?? 0).shiftedBy(-this.leftTokenDecimals)
        return (
            isGoodBignumber(this.leftAmountNumber)
            && this.leftAmountNumber.shiftedBy(-this.leftTokenDecimals).lte(balance)
        )
    }

    public get isEnoughCombinedBalance(): boolean {
        const fee = new BigNumber(this.initialData?.swapFee ?? 0).shiftedBy(-this.coin.decimals)
        return this.leftAmountNumber.shiftedBy(-this.leftTokenDecimals).lte(this.combinedBalanceNumber.minus(fee))
    }

    public get isLeftAmountValid(): boolean {
        if (this.leftAmount.length === 0) {
            return true
        }
        return (
            this.leftAmount.length > 0
            && isGoodBignumber(this.leftAmountNumber)
            && this.isEnoughCombinedBalance
        )
    }

    /**
     * Returns `true` if all data and bill is valid, otherwise `false`.
     * @returns {boolean}
     */
    public get isValid(): boolean {
        return (
            this.isEnoughLiquidity
            && (this.isEnoughTokenBalance || this.isEnoughCoinBalance || this.isEnoughCombinedBalance)
            && this.wallet.account?.address !== undefined
            && this.pair?.address !== undefined
            && this.pair?.contract !== undefined
            && this.leftToken?.wallet !== undefined
            && this.leftTokenAddress !== undefined
            && isGoodBignumber(this.amount || 0)
            && isGoodBignumber(this.expectedAmount || 0)
            && isGoodBignumber(this.minExpectedAmount || 0)
        )
    }

}
