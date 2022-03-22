import { computed, makeObservable, override } from 'mobx'
import BigNumber from 'bignumber.js'

import { DirectSwapStore } from '@/modules/Swap/stores/DirectSwapStore'
import { WalletService } from '@/stores/WalletService'
import { TokensCacheService } from '@/stores/TokensCacheService'
import type { CoinSwapStoreInitialData, DirectSwapStoreData, SwapTransactionCallbacks } from '@/modules/Swap/types'
import { isGoodBignumber } from '@/utils'


export class CoinSwapStore extends DirectSwapStore {

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly initialData?: CoinSwapStoreInitialData,
        protected readonly callbacks?: SwapTransactionCallbacks,
    ) {
        super(wallet, tokensCache, initialData)

        makeObservable(this, {
            coin: computed,
            isEnoughCoinBalance: computed,
            isLeftAmountValid: override,
            isValid: override,
        })
    }

    public async submit(): Promise<void> {
        console.log('CoinSwapStore@submit', this)
    }

    public get coin(): DirectSwapStoreData['coin'] {
        return this.data.coin
    }

    public get isEnoughCoinBalance(): boolean {
        const balance = new BigNumber(this.coin.balance ?? 0).shiftedBy(-this.coin.decimals)
        const fee = new BigNumber(this.initialData?.swapFee ?? 0).shiftedBy(-this.coin.decimals)
        return (
            isGoodBignumber(this.leftAmountNumber)
            && this.leftAmountNumber.shiftedBy(-this.leftTokenDecimals).lt(balance.minus(fee))
        )
    }

    protected async swapCoinToTip3(): Promise<void> {
        console.log(this)
    }

    protected async swapTip3ToCoin(): Promise<void> {
        console.log(this)
    }

}
