import { DEFAULT_CREATE_TOKEN_STORE_DATA, DEFAULT_CREATE_TOKEN_STORE_STATE } from '@/modules/Builder/constants'
import {
    CreateTokenStoreData,
    CreateTokenStoreDataProp,
    CreateTokenStoreState,
    CreateTokenStoreStateProp,
    CreateTokenTransactionProp,
    CreateTokenTransactionResult,
} from '@/modules/Builder/types'
import { useWallet, WalletData, WalletService } from '@/stores/WalletService'
import {
    action, IReactionDisposer, makeAutoObservable, reaction, runInAction, toJS,
} from 'mobx'
import { Address, Contract } from 'ton-inpage-provider'
import { DexConstants, TokenAbi } from '@/misc'
import { error } from '@/utils'

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
     *
     * @param {WalletService} wallet
     */
    constructor(protected readonly wallet: WalletService = useWallet()) {
        makeAutoObservable<
            CreateTokenStore,
            | 'handleWalletAccountChange'
            | 'handleTransactionResult'
        >(this, {
            changeData: action.bound,
            createToken: action.bound,
            handleWalletAccountChange: action.bound,
            handleTransactionResult: action.bound,
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

    public init(): void {
        this.#walletAccountDisposer = reaction(() => this.wallet.address, this.handleWalletAccountChange)

        this.#transactionDisposer = reaction(() => this.wallet.transaction, this.handleTransactionResult)
    }

    /**
     * Manually dispose all of the internal subscribers.
     * Clean reset creating token `data` to default values.
     */
    public dispose(): void {
        this.#walletAccountDisposer?.()
        this.#transactionDisposer?.()
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
     *
     * @returns {Promise<void>>}
     */
    public async createToken(): Promise<void> {
        if (
            !this.wallet.address
            || !this.name
            || !this.symbol
            || !this.decimals
        ) {
            this.changeState(CreateTokenStoreStateProp.IS_CREATING, false)
            return
        }

        this.changeState(CreateTokenStoreStateProp.IS_CREATING, true)

        await new Contract(TokenAbi.Factory, DexConstants.TokenFactoryAddress).methods.Token({
            answer_id: 0,
            root_public_key: 0,
            root_owner_address: new Address(this.wallet.address),
            name: btoa(this.name),
            symbol: btoa(this.symbol),
            decimals: this.decimals,
        }).send({
            from: new Address(this.wallet.address),
            amount: '5000000000',
            bounce: true,
        })
    }

    /**
     *
     * @param {WalletData['transaction']} [transaction]
     * @protected
     */
    protected async handleTransactionResult(transaction?: WalletData['transaction']): Promise<void> {
        if (!this.wallet.address || !transaction?.inMessage.body) {
            return
        }

        const owner = new Contract(TokenAbi.TokenRootDeployCallbacks, new Address(this.wallet.address))

        await owner.decodeTransaction({
            transaction: toJS(transaction),
            methods: [
                'notifyTokenRootDeployed',
                'notifyTokenRootNotDeployed',
            ],
        }).then(res => {
            if (res?.method === 'notifyTokenRootNotDeployed') {
                runInAction(() => {
                    this.transactionResult = {
                        [CreateTokenTransactionProp.SUCCESS]: false,
                    }

                    this.changeState(CreateTokenStoreStateProp.IS_CREATING, false)
                    this.data[CreateTokenStoreDataProp.NAME] = ''
                    this.data[CreateTokenStoreDataProp.SYMBOL] = ''
                    this.data[CreateTokenStoreDataProp.DECIMALS] = ''
                })
            }
            else if (res?.method === 'notifyTokenRootDeployed') {
                runInAction(() => {
                    this.transactionResult = {
                        [CreateTokenTransactionProp.HASH]: transaction.id.hash,
                        [CreateTokenTransactionProp.ROOT]: res.input.token_root.toString(),
                        [CreateTokenTransactionProp.NAME]: this.name,
                        [CreateTokenTransactionProp.SYMBOL]: this.symbol,
                        [CreateTokenTransactionProp.SUCCESS]: true,
                    }

                    this.changeState(CreateTokenStoreStateProp.IS_CREATING, false)
                    this.data[CreateTokenStoreDataProp.NAME] = ''
                    this.data[CreateTokenStoreDataProp.SYMBOL] = ''
                    this.data[CreateTokenStoreDataProp.DECIMALS] = ''
                })

                localStorage.setItem(
                    'tokens',
                    JSON.stringify([
                        ...JSON.parse(localStorage.getItem('tokens') || '[]'),
                        res.input.token_root.toString(),
                    ]),
                )
            }
        }).catch(reason => {
            error('decodeTransaction error: ', reason)
            runInAction(() => {
                this.transactionResult = {
                    [CreateTokenTransactionProp.SUCCESS]: true,
                }

                this.changeState(CreateTokenStoreStateProp.IS_CREATING, false)
            })
        })
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
     * @returns {CreateTokenStoreData[CreateTokenStoreDataProp.NAME]}
     */
    public get name(): CreateTokenStoreData[CreateTokenStoreDataProp.NAME] {
        return this.data[CreateTokenStoreDataProp.NAME]
    }

    /**
     *
     * @returns {CreateTokenStoreData[CreateTokenStoreDataProp.SYMBOL]}
     */
    public get symbol(): CreateTokenStoreData[CreateTokenStoreDataProp.SYMBOL] {
        return this.data[CreateTokenStoreDataProp.SYMBOL]
    }

    /**
     *
     * @returns {CreateTokenStoreData[CreateTokenStoreDataProp.NAME]}
     */
    public get decimals(): CreateTokenStoreData[CreateTokenStoreDataProp.DECIMALS] {
        return this.data[CreateTokenStoreDataProp.DECIMALS]
    }

    public get isBuilding(): CreateTokenStoreState[CreateTokenStoreStateProp.IS_CREATING] {
        return this.state[CreateTokenStoreStateProp.IS_CREATING]
    }

    public get transaction(): CreateTokenTransactionResult | undefined {
        return this.transactionResult
    }

    #walletAccountDisposer: IReactionDisposer | undefined

    #transactionDisposer: IReactionDisposer | undefined

}

const CreateToken = new CreateTokenStore()

export function useCreateTokenStore(): CreateTokenStore {
    return CreateToken
}
