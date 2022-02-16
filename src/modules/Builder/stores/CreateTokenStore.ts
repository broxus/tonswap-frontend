import {
    action,
    IReactionDisposer,
    makeAutoObservable,
    reaction,
} from 'mobx'
import * as E from 'fp-ts/Either'
import { Address, AddressLiteral, Subscriber } from 'everscale-inpage-provider'

import { useRpcClient } from '@/hooks/useRpcClient'
import { DexConstants, TokenAbi } from '@/misc'
import {
    DEFAULT_CREATE_TOKEN_STORE_DATA,
    DEFAULT_CREATE_TOKEN_STORE_STATE,
} from '@/modules/Builder/constants'
import {
    CreateTokenStoreData,
    CreateTokenStoreState,
    CreateTokenSuccessResult,
    CreateTokenTransactionResult,
} from '@/modules/Builder/types'
import { saveTokenToLocalStorage } from '@/modules/Builder/utils'
import { useWallet, WalletService } from '@/stores/WalletService'
import { error } from '@/utils'


const rpc = useRpcClient()


export class CreateTokenStore {

    /**
     * Current data of the creating token form
     * @type {CreateTokenStoreData}
     * @protected
     */
    protected data: CreateTokenStoreData = DEFAULT_CREATE_TOKEN_STORE_DATA

    /**
     * Current state of the creating token store
     * @type {CreateTokenStoreState}
     * @protected
     */
    protected state: CreateTokenStoreState = DEFAULT_CREATE_TOKEN_STORE_STATE

    /**
     * Last creating token transaction result data
     * @type {CreateTokenTransactionResult | undefined}
     * @protected
     */
    protected transactionResult: CreateTokenTransactionResult | undefined = undefined

    /**
     * Internal builder transaction subscriber
     * @type {Subscriber}
     * @protected
     */
    protected transactionSubscriber: Subscriber | undefined

    /**
     *
     * @param {WalletService} wallet
     */
    constructor(protected readonly wallet: WalletService = useWallet()) {
        makeAutoObservable<
            CreateTokenStore,
            | 'handleWalletAccountChange'
            | 'handleTransactionResult'
            | 'handleCreateTokenSuccess'
            | 'handleCreateTokenFailure'
        >(this, {
            changeData: action.bound,
            createToken: action.bound,
            handleWalletAccountChange: action.bound,
            handleTransactionResult: action.bound,
            handleCreateTokenSuccess: action.bound,
            handleCreateTokenFailure: action.bound,
        })
    }

    /**
     * Manually change store data by the given key
     * @template K
     * @param {K} key
     * @param {CreateTokenStoreData[k]} value
     */
    public changeData<K extends keyof CreateTokenStoreData>(key: K, value: CreateTokenStoreData[K]): void {
        this.data[key] = value
    }

    /**
     * Manually change store state by the given key
     * @template K
     * @param {K} key
     * @param {CreateTokenStoreState[K]} value
     */
    protected changeState<K extends keyof CreateTokenStoreState>(key: K, value: CreateTokenStoreState[K]): void {
        this.state[key] = value
    }

    public async init(): Promise<void> {
        if (this.transactionSubscriber !== undefined) {
            await this.transactionSubscriber.unsubscribe()
            this.transactionSubscriber = undefined
        }

        this.transactionSubscriber = rpc.createSubscriber()

        this.#walletAccountDisposer = reaction(() => this.wallet.address, this.handleWalletAccountChange)
    }

    /**
     * Manually dispose all of the internal subscribers.
     * Clean reset creating token `data` to default values.
     */
    public async dispose(): Promise<void> {
        if (this.transactionSubscriber !== undefined) {
            await this.transactionSubscriber.unsubscribe()
            this.transactionSubscriber = undefined
        }

        this.#walletAccountDisposer?.()
        this.reset()
    }

    /**
     * Manually clean last transaction result
     */
    public cleanTransactionResult(): void {
        this.transactionResult = undefined
    }

    /**
     *
     * @param {string} [walletAddress]
     * @param {string} [prevWalletAddress]
     * @protected
     */
    protected handleWalletAccountChange(walletAddress?: string, prevWalletAddress?: string): void {
        if (walletAddress !== prevWalletAddress) {
            this.reset()
        }
    }

    /**
     * Success transaction callback handler
     * @param {CreateTokenSuccessResult['input']} input
     * @param {CreateTokenFailureResult['transaction']} transaction
     * @protected
     */
    protected handleCreateTokenSuccess({ input, transaction }: CreateTokenSuccessResult): void {
        this.transactionResult = {
            hash: transaction.id.hash,
            name: this.name,
            root: input.token_root.toString(),
            success: true,
            symbol: this.symbol,
        }

        this.changeState('isCreating', false)

        this.changeData('decimals', '')
        this.changeData('name', '')
        this.changeData('symbol', '')

        saveTokenToLocalStorage(input.token_root.toString())
    }

    /**
     * Failure transaction callback handler
     * @protected
     */
    protected handleCreateTokenFailure(): void {
        this.transactionResult = {
            success: false,
        }

        this.changeState('isCreating', false)
        this.changeData('decimals', '')
        this.changeData('name', '')
        this.changeData('symbol', '')
    }

    /**
     *
     * Manually start creating token processing
     * @returns {Promise<void>>}
     */
    public async createToken(): Promise<void> {
        if (
            !this.wallet.address
            || !this.name
            || !this.symbol
            || !this.decimals
        ) {
            this.changeState('isCreating', false)
            return
        }

        // eslint-disable-next-line no-bitwise
        const callId = ((Math.random() * 100000) | 0).toString()

        this.changeState('isCreating', true)

        try {
            await rpc.createContract(
                TokenAbi.Factory,
                DexConstants.TokenFactoryAddress,
            ).methods.createToken({
                callId,
                name: this.name.trim(),
                symbol: this.symbol.trim(),
                decimals: this.decimals.trim(),
                initialSupplyTo: new AddressLiteral('0:0000000000000000000000000000000000000000000000000000000000000000'),
                initialSupply: 0,
                deployWalletValue: '0',
                mintDisabled: false,
                burnByRootDisabled: false,
                burnPaused: false,
                remainingGasTo: new Address(this.wallet.address),
            }).send({
                from: new Address(this.wallet.address),
                amount: '5000000000',
                bounce: true,
            })
        }
        catch (e) {
            error('Create token error', e)
            this.changeState('isCreating', false)
        }

        const owner = rpc.createContract(TokenAbi.TokenRootDeployCallbacks, new Address(this.wallet.address))

        let stream = this.transactionSubscriber?.transactions(
            new Address(this.wallet.address),
        )

        const oldStream = this.transactionSubscriber?.oldTransactions(new Address(this.wallet.address), {
            fromLt: this.wallet.contract?.lastTransactionId?.lt,
        })

        if (stream !== undefined && oldStream !== undefined) {
            stream = stream.merge(oldStream)
        }

        const resultHandler = stream?.flatMap(a => a.transactions).filterMap(async transaction => {
            const result = await owner.decodeTransaction({
                transaction,
                methods: ['onTokenRootDeployed'],
            })

            if (result !== undefined) {
                if (result.method === 'onTokenRootDeployed' && result.input.callId.toString() === callId) {
                    return E.right({ input: result.input, transaction })
                }

                return E.left({ input: result.input })
            }

            return undefined
        }).first()

        if (resultHandler !== undefined) {
            E.match(
                this.handleCreateTokenFailure,
                this.handleCreateTokenSuccess,
            )(await resultHandler)
        }
    }

    /**
     * Reset creating token `state` to default values
     * @protected
     */
    protected reset(): void {
        this.data = {
            ...DEFAULT_CREATE_TOKEN_STORE_DATA,
        }
    }

    /**
     *
     * @returns {CreateTokenStoreData['decimals']}
     */
    public get decimals(): CreateTokenStoreData['decimals'] {
        return this.data.decimals
    }

    /**
     *
     * @returns {CreateTokenStoreData['name']}
     */
    public get name(): CreateTokenStoreData['name'] {
        return this.data.name
    }

    /**
     *
     * @returns {CreateTokenStoreData['symbol']}
     */
    public get symbol(): CreateTokenStoreData['symbol'] {
        return this.data.symbol
    }

    public get isCreating(): CreateTokenStoreState['isCreating'] {
        return this.state.isCreating
    }

    public get transaction(): CreateTokenTransactionResult | undefined {
        return this.transactionResult
    }

    #walletAccountDisposer: IReactionDisposer | undefined

}

const CreateToken = new CreateTokenStore()

export function useCreateTokenStore(): CreateTokenStore {
    return CreateToken
}
