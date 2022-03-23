import BigNumber from 'bignumber.js'
import { Address, Subscriber } from 'everscale-inpage-provider'
import * as E from 'fp-ts/Either'
import { computed, makeObservable, override } from 'mobx'

import { useRpcClient } from '@/hooks/useRpcClient'
import { DexConstants, EverAbi, TokenAbi } from '@/misc'
import { DirectSwapStore } from '@/modules/Swap/stores/DirectSwapStore'
import { WalletService } from '@/stores/WalletService'
import { TokensCacheService } from '@/stores/TokensCacheService'
import { error, isGoodBignumber } from '@/utils'
import type {
    CoinSwapFailureResult,
    CoinSwapStoreInitialData,
    CoinSwapSuccessResult,
    CoinSwapTransactionCallbacks,
    DirectSwapStoreData,
} from '@/modules/Swap/types'


const rpc = useRpcClient()


export class CoinSwapStore extends DirectSwapStore {

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly initialData?: CoinSwapStoreInitialData,
        protected readonly _callbacks?: CoinSwapTransactionCallbacks,
    ) {
        super(wallet, tokensCache, initialData)

        makeObservable(this, {
            coin: computed,
            isEnoughCoinBalance: computed,
            isLeftAmountValid: override,
            isValid: override,
        })

        this.#transactionSubscriber = new rpc.Subscriber()
    }

    public async submit(way: 'fromCoinToTip3' | 'fromTip3ToCoin'): Promise<void> {
        switch (way) {
            case 'fromCoinToTip3':
                await this.swapCoinToTip3()
                break

            case 'fromTip3ToCoin':
                await this.swapTip3ToCoin()
                break

            default:
        }
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

        const coinToTip3Contract = new rpc.Contract(EverAbi.EverToTip3, DexConstants.EverToTip3Address)

        const payload = (await coinToTip3Contract.methods.buildExchangePayload({
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

        const weverVault = new rpc.Contract(EverAbi.WeverVault, DexConstants.WeverVaultAddress)

        try {
            await weverVault.methods.wrap({
                payload,
                tokens: this.leftAmountNumber.toFixed(),
                gas_back_address: this.wallet.account!.address,
                owner_address: DexConstants.EverToTip3Address,
            }).send({
                amount: this.leftAmountNumber.plus('5000000000').toFixed(),
                from: this.wallet.account!.address,
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

    protected async swapTip3ToCoin(): Promise<void> {
        if (!this.isValid) {
            this.setState('isSwapping', false)

        }

        this.setState('isSwapping', true)

        const tip3ToCoinContract = new rpc.Contract(EverAbi.Tip3ToEver, DexConstants.Tip3ToEverAddress)

        const tokenRoot = new rpc.Contract(TokenAbi.Root, new Address(this.leftToken!.root))
        const walletAddress = (await tokenRoot.methods.walletOf({
            answerId: 0,
            walletOwner: DexConstants.Tip3ToEverAddress,
        }).call()).value0

        if (walletAddress === undefined) {
            return
        }

        const tip3ToCoinWalletContract = new rpc.Contract(TokenAbi.Wallet, walletAddress)

        let hasWallet = false

        try {
            hasWallet = (await tip3ToCoinWalletContract
                .methods.balance({ answerId: 0 })
                .call()).value0 !== undefined
        }
        catch (e) {
            error(e)
        }

        const deployGrams = !hasWallet ? '100000000' : '0'

        const processingId = new BigNumber(
            Math.floor(
                Math.random() * (Number.MAX_SAFE_INTEGER - 1),
            ) + 1,
        ).toFixed()

        const payload = (await tip3ToCoinContract.methods.buildExchangePayload({
            id: processingId,
            pair: this.pair!.address!,
            expectedAmount: this.minExpectedAmount!,
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
                methods: ['onSwapTip3ToEverSuccess', 'onSwapTip3ToEverCancel'],
            })

            if (result !== undefined) {
                if (result.method === 'onSwapTip3ToEverCancel' && result.input.id.toString() === processingId) {
                    this.setState('isSwapping', false)
                    return E.left({ input: result.input })
                }

                if (result.method === 'onSwapTip3ToEverSuccess' && result.input.id.toString() === processingId) {
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
                recipient: DexConstants.Tip3ToEverAddress,
                deployWalletValue: deployGrams,
                amount: this.amount!,
                notify: true,
                remainingGasTo: this.wallet.account!.address!,
            }).send({
                amount: new BigNumber(3600000000).plus(deployGrams).toFixed(),
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

    /**
     * Internal swap transaction subscriber
     * @type {Subscriber}
     * @protected
     */
    #transactionSubscriber: Subscriber | undefined

}
