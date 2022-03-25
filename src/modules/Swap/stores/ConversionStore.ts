import BigNumber from 'bignumber.js'
import { Address } from 'everscale-inpage-provider'
import { computed, makeObservable } from 'mobx'

import { DexConstants, TokenAbi } from '@/misc'
import { useRpcClient } from '@/hooks/useRpcClient'
import { BaseStore } from '@/stores/BaseStore'
import { TokensCacheService } from '@/stores/TokensCacheService'
import { WalletService } from '@/stores/WalletService'
import { error, isGoodBignumber, log } from '@/utils'
import type {
    ConversionStoreData,
    ConversionStoreInitialData,
    ConversionStoreState,
    ConversionTransactionCallbacks,
} from '@/modules/Swap/types'
import type { TokenCache } from '@/stores/TokensCacheService'


const rpc = useRpcClient()


export class ConversionStore extends BaseStore<ConversionStoreData, ConversionStoreState> {

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly initialData?: ConversionStoreInitialData,
        protected readonly callbacks?: ConversionTransactionCallbacks,
    ) {
        super()

        this.setData({
            amount: '',
            coin: initialData?.coin,
            token: initialData?.token,
        })

        this.setState({
            isProcessing: false,
        })

        makeObservable(this, {
            wrappedAmount: computed,
            unwrappedAmount: computed,
            token: computed,
            txHash: computed,
            isWrapAmountValid: computed,
            isUnwrapAmountValid: computed,
            isInsufficientWrapBalance: computed,
            isInsufficientUnwrapBalance: computed,
            isProcessing: computed,
            isWrapValid: computed,
            isUnwrapValid: computed,
        })
    }

    public async wrap(): Promise<void> {
        if (this.wallet.account?.address === undefined || this.coin?.decimals === undefined) {
            return
        }

        try {
            const wrappedAmount = new BigNumber(this.amount ?? 0).shiftedBy(this.coin.decimals)
            const amount = wrappedAmount.plus(this.initialData?.wrapGas ?? 0).toFixed()

            this.setState('isProcessing', true)

            const { transaction } = await rpc.sendMessage({
                amount,
                bounce: false,
                recipient: DexConstants.WeverVaultAddress,
                sender: this.wallet.account.address,
            })

            log('Wrap successful. Tx Hash: ', transaction.id.hash)

            this.setData({
                amount: '',
                txHash: transaction.id.hash,
                wrappedAmount: wrappedAmount.toFixed(),
            })

            this.callbacks?.onTransactionSuccess?.({
                amount: wrappedAmount.toFixed(),
                txHash: transaction.id.hash,
            })
        }
        catch (e) {
            error('EVER wrap error', e)
        }
        finally {
            this.setState('isProcessing', false)
        }
    }

    public async unwrap(): Promise<void> {
        if (
            this.wallet.account?.address === undefined
            || this.token?.wallet === undefined
            || this.token?.decimals === undefined
        ) {
            return
        }

        try {
            const amount = new BigNumber(this.amount ?? 0).shiftedBy(this.token.decimals ?? 0).toFixed()

            this.setState('isProcessing', true)

            const tokenWalletContract = new rpc.Contract(TokenAbi.Wallet, new Address(this.token.wallet))
            const transaction = await tokenWalletContract
                .methods.transfer({
                    amount,
                    deployWalletValue: '0',
                    notify: true,
                    recipient: DexConstants.WeverVaultAddress,
                    remainingGasTo: this.wallet.account.address,
                    payload: '',
                })
                .send({
                    amount: '500000000',
                    bounce: false,
                    from: this.wallet.account.address,
                })

            log('Unwrap successful. Tx: Hash', transaction.id.hash)

            this.setData({
                amount: '',
                txHash: transaction.id.hash,
                unwrappedAmount: amount,
            })

            this.callbacks?.onTransactionSuccess?.({
                amount,
                txHash: transaction.id.hash,
            })
        }
        catch (e) {
            error('WEVER unwrap error', e)
        }
        finally {
            this.setState('isProcessing', false)
        }
    }

    public get amount(): ConversionStoreData['amount'] {
        return this.data.amount
    }

    public get wrappedAmount(): ConversionStoreData['wrappedAmount'] {
        return this.data.wrappedAmount
    }

    public get unwrappedAmount(): ConversionStoreData['unwrappedAmount'] {
        return this.data.unwrappedAmount
    }

    public get coin(): ConversionStoreData['coin'] {
        return this.data.coin
    }

    public get token(): TokenCache | undefined {
        return this.tokensCache.get(this.data.token)
    }

    public get txHash(): ConversionStoreData['txHash'] {
        return this.data.txHash
    }

    public get isWrapAmountValid(): boolean {
        if (this.amount.length === 0) {
            return true
        }

        return this.amount.length > 0 && !this.isInsufficientWrapBalance
    }

    public get isUnwrapAmountValid(): boolean {
        if (this.amount.length === 0) {
            return true
        }

        return this.amount.length > 0 && !this.isInsufficientUnwrapBalance
    }

    public get isInsufficientWrapBalance(): boolean {
        if (this.coin?.decimals === undefined) {
            return true
        }

        const amount = new BigNumber(this.amount || 0)
        const balance = new BigNumber(this.wallet.balance || 0).shiftedBy(-this.coin.decimals)
        const safeAmount = new BigNumber(this.initialData?.safeAmount ?? 0).shiftedBy(-this.coin.decimals)

        return isGoodBignumber(amount) && balance.minus(safeAmount).lt(amount)
    }

    public get isInsufficientUnwrapBalance(): boolean {
        if (this.token?.decimals === undefined) {
            return true
        }

        const amount = new BigNumber(this.amount || 0)
        const balance = new BigNumber(this.token?.balance || 0).shiftedBy(-this.token.decimals)

        return isGoodBignumber(amount) && balance.lt(amount)
    }

    public get isProcessing(): ConversionStoreState['isProcessing'] {
        return this.state.isProcessing
    }

    public get isWrapValid(): boolean {
        return this.amount.length > 0 && isGoodBignumber(this.amount) && this.isWrapAmountValid
    }

    public get isUnwrapValid(): boolean {
        return this.amount.length > 0 && isGoodBignumber(this.amount) && this.isUnwrapAmountValid
    }

}
