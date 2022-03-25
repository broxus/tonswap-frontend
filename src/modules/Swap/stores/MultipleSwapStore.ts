import BigNumber from 'bignumber.js'
import { Address, Subscriber } from 'everscale-inpage-provider'
import * as E from 'fp-ts/Either'
import { computed, makeObservable, override } from 'mobx'

import { useRpcClient } from '@/hooks/useRpcClient'
import { DexConstants, EverAbi, TokenAbi } from '@/misc'
import { CoinSwapStore } from '@/modules/Swap/stores/CoinSwapStore'
import { TokensCacheService } from '@/stores/TokensCacheService'
import { WalletService } from '@/stores/WalletService'
import { error, isGoodBignumber } from '@/utils'
import type {
    CoinSwapFailureResult,
    CoinSwapStoreInitialData,
    CoinSwapSuccessResult,
    CoinSwapTransactionCallbacks,
} from '@/modules/Swap/types'


const rpc = useRpcClient()


export class MultipleSwapStore extends CoinSwapStore {

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly initialData?: CoinSwapStoreInitialData,
        protected readonly _callbacks?: CoinSwapTransactionCallbacks,
    ) {
        super(wallet, tokensCache, initialData)

        makeObservable(this, {
            combinedBalanceNumber: computed,
            isEnoughCombinedBalance: computed,
            isEnoughTokenBalance: computed,
            isLeftAmountValid: override,
            isValid: override,
        })

        this.#transactionSubscriber = new rpc.Subscriber()
    }

    public async submit(): Promise<void> {
        if (!this.isValid) {
            this.setState('isSwapping', false)
            return
        }

        this.setState('isSwapping', true)

        const tokenRoot = new rpc.Contract(TokenAbi.Root, this.rightTokenAddress!)
        const walletAddress = (await tokenRoot.methods.walletOf({
            answerId: 0,
            walletOwner: DexConstants.EverToTip3Address,
        }).call()).value0

        if (walletAddress === undefined) {
            return
        }

        const everWeverToTip3Contract = new rpc.Contract(EverAbi.EverWeverToTipP3, DexConstants.EverWeverToTip3Address)

        const coinToTip3WalletContract = new rpc.Contract(TokenAbi.Wallet, walletAddress)

        let hasWallet = false

        try {
            hasWallet = (await coinToTip3WalletContract
                .methods.balance({ answerId: 0 })
                .call()).value0 !== undefined
        }
        catch (e) {
            error(e)
        }

        const deployGrams = (this.rightToken?.balance === undefined || !hasWallet) ? '100000000' : '0'

        const processingId = new BigNumber(
            Math.floor(
                Math.random() * (Number.MAX_SAFE_INTEGER - 1),
            ) + 1,
        ).toFixed()

        const payload = (await everWeverToTip3Contract.methods.buildExchangePayload({
            id: processingId,
            deployWalletValue: deployGrams,
            amount: this.leftAmountNumber.toFixed(),
            expectedAmount: this.minExpectedAmount!,
            pair: this.pair!.address!,
        }).call()).value0

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
                methods: ['onSwapEverToTip3Success', 'onSwapEverToTip3Cancel'],
            })

            if (result !== undefined) {
                if (result.method === 'onSwapEverToTip3Cancel' && result.input.id.toString() === processingId) {
                    this.setState('isSwapping', false)
                    return E.left({ input: result.input })
                }

                if (result.method === 'onSwapEverToTip3Success' && result.input.id.toString() === processingId) {
                    this.setState('isSwapping', false)
                    return E.right({ input: result.input, transaction })
                }
            }

            return undefined
        }).first()

        const tokenWalletContract = new rpc.Contract(TokenAbi.Wallet, new Address(this.leftToken!.wallet!))
        try {
            await tokenWalletContract.methods.transfer({
                payload,
                recipient: DexConstants.EverWeverToTip3Address,
                deployWalletValue: '0',
                amount: this.leftToken!.balance!,
                notify: true,
                remainingGasTo: this.wallet.account!.address!,
            }).send({
                amount: this.leftAmountNumber.minus(this.leftToken!.balance!).plus(5000000000).toFixed(),
                from: this.wallet.account!.address!,
                bounce: true,
            })

            if (resultHandler !== undefined) {
                E.match(
                    (r: CoinSwapFailureResult) => {
                        this.setState('isSwapping', false)
                        this._callbacks?.onTransactionFailure?.(r)
                    },
                    (r: CoinSwapSuccessResult) => {
                        this.setState('isSwapping', false)
                        this._callbacks?.onTransactionSuccess?.(r)
                    },
                )(await resultHandler)
            }
        }
        catch (e) {
            error('decodeTransaction error: ', e)
            this.setState('isSwapping', false)
        }
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
            && isGoodBignumber(this.leftAmountNumber, false)
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


    /**
     * Internal swap transaction subscriber
     * @type {Subscriber}
     * @protected
     */
    #transactionSubscriber: Subscriber | undefined

}
