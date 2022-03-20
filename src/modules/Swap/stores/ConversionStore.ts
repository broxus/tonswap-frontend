import BigNumber from 'bignumber.js'
import { Address } from 'everscale-inpage-provider'

import { DexConstants, TokenAbi } from '@/misc'
import { useRpcClient } from '@/hooks/useRpcClient'
import { BaseStore } from '@/stores/BaseStore'
import { TokensCacheService } from '@/stores/TokensCacheService'
import { WalletService } from '@/stores/WalletService'
import { error, isGoodBignumber, log } from '@/utils'
import type { SwapTransactionCallbacks } from '@/modules/Swap/types'
import type { TokenCache } from '@/stores/TokensCacheService'
import type { WalletNativeCoin } from '@/stores/WalletService'


export type ConversionStoreInitialData = {
    coin?: WalletNativeCoin;
    token?: string;
    wrapFee?: string;
}

export interface ConversionStoreData extends Exclude<ConversionStoreInitialData, 'wrapFee'> {
    amount: string;
    wrappedAmount?: string;
    unwrappedAmount?: string;
}

export type ConversionStoreState = {
    isProcessing: boolean;
}


const rpc = useRpcClient()


export class ConversionStore extends BaseStore<ConversionStoreData, ConversionStoreState> {

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly initialData?: ConversionStoreInitialData,
        protected readonly callbacks?: SwapTransactionCallbacks,
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
    }

    public async wrap(): Promise<void> {
        if (this.wallet.account?.address === undefined || this.coin?.decimals === undefined) {
            return
        }

        try {
            const wrappedAmount = new BigNumber(this.amount ?? 0).shiftedBy(this.coin.decimals)
            const amount = wrappedAmount.plus(this.initialData?.wrapFee ?? 0).toFixed()

            this.setState('isProcessing', true)

            const { transaction } = await rpc.sendMessage({
                amount,
                bounce: false,
                recipient: DexConstants.DexVaultAddress,
                sender: this.wallet.account.address,
            })

            log('Wrap successful. Tx Hash: ', transaction.id.hash)

            this.setData({
                amount: '',
                wrappedAmount: wrappedAmount.toFixed(),
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
            const transactionId = (await tokenWalletContract
                .methods.transfer({
                    amount,
                    deployWalletValue: '0',
                    notify: true,
                    recipient: DexConstants.DexVaultAddress,
                    remainingGasTo: this.wallet.account.address,
                    payload: '',
                })
                .send({
                    amount: '500000000',
                    bounce: false,
                    from: this.wallet.account.address,
                }))
                .id

            log('Unwrap successful. Tx: Hash', transactionId.hash)

            this.setData({
                amount: '',
                unwrappedAmount: amount,
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

    public get coin(): ConversionStoreData['coin'] {
        return this.data.coin
    }

    public get token(): TokenCache | undefined {
        return this.tokensCache.get(this.data.token)
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
        const balance = new BigNumber(this.wallet.balance || 0)
        const fee = new BigNumber(this.initialData?.wrapFee ?? 0).shiftedBy(-this.coin.decimals)

        return (
            isGoodBignumber(amount)
            && balance.shiftedBy(-this.coin.decimals).lt(amount.plus(fee))
        )
    }

    public get isInsufficientUnwrapBalance(): boolean {
        if (this.token?.decimals === undefined) {
            return true
        }

        const amount = new BigNumber(this.amount || 0)
        const balance = new BigNumber(this.token?.balance || 0)

        return (
            isGoodBignumber(amount)
            && balance.shiftedBy(-(this.token.decimals)).lt(amount)
        )
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
