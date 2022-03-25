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
            isEnoughCoinBalance: computed,
            isLeftAmountValid: override,
            isValid: override,
        })

        this.#transactionSubscriber = new rpc.Subscriber()
    }


    /*
     * Public actions. Useful in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @param way
     */
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


    /*
     * Computed values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get isEnoughCoinBalance(): boolean {
        const balance = new BigNumber(this.coin.balance ?? 0).shiftedBy(-this.coin.decimals)
        const fee = new BigNumber(this.initialData?.swapFee ?? 0).shiftedBy(-this.coin.decimals)
        return (
            isGoodBignumber(this.leftAmountNumber)
            && this.leftAmountNumber.shiftedBy(-this.leftTokenDecimals).lte(balance.minus(fee))
        )
    }


    /*
     * Internal and external utilities methods
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @protected
     */
    protected async swapCoinToTip3(): Promise<void> {
        if (!this.isValidCoinToTip3) {
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
            amount: this.leftAmountNumber.toFixed(),
            deployWalletValue: deployGrams,
            expectedAmount: this.minExpectedAmount!,
            id: processingId,
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
                gas_back_address: this.wallet.account!.address,
                owner_address: DexConstants.EverToTip3Address,
                payload,
                tokens: this.leftAmountNumber.toFixed(),
            }).send({
                amount: this.leftAmountNumber.plus('5000000000').toFixed(),
                bounce: true,
                from: this.wallet.account!.address,
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
     *
     * @protected
     */
    protected async swapTip3ToCoin(): Promise<void> {
        if (!this.isValidTip3ToCoin) {
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
            expectedAmount: this.minExpectedAmount!,
            id: processingId,
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
                amount: this.amount!,
                deployWalletValue: deployGrams,
                notify: true,
                payload,
                recipient: DexConstants.Tip3ToEverAddress,
                remainingGasTo: this.wallet.account!.address!,
            }).send({
                amount: new BigNumber(3600000000).plus(deployGrams).toFixed(),
                bounce: true,
                from: this.wallet.account!.address!,
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
     * Returns `true` if all data and bill is valid, otherwise `false`.
     * @returns {boolean}
     */
    public get isValidCoinToTip3(): boolean {
        return (
            this.isEnoughCoinBalance
            && this.wallet.account?.address !== undefined
            && new BigNumber(this.amount || 0).gt(0)
            && new BigNumber(this.expectedAmount || 0).gt(0)
            && new BigNumber(this.minExpectedAmount || 0).gt(0)
        )
    }

    /**
     * Returns `true` if all data and bill is valid, otherwise `false`.
     * @returns {boolean}
     */
    public get isValidTip3ToCoin(): boolean {
        return (
            this.wallet.account?.address !== undefined
            && this.leftToken?.wallet !== undefined
            && this.leftTokenAddress !== undefined
            && new BigNumber(this.amount || 0).gt(0)
            && new BigNumber(this.expectedAmount || 0).gt(0)
            && new BigNumber(this.minExpectedAmount || 0).gt(0)
            && new BigNumber(this.leftToken?.balance || 0).gte(this.amount || 0)
        )
    }

    /**
     * Internal swap transaction subscriber
     * @type {Subscriber}
     * @protected
     */
    #transactionSubscriber: Subscriber | undefined

}
