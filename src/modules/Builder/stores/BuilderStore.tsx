import {
    action, IReactionDisposer, makeAutoObservable, reaction,
} from 'mobx'
import ton, { Address, Contract } from 'ton-inpage-provider'

import {
    BuilderStoreData,
    BuilderStoreDataProp,
    BuilderStoreState,
    BuilderStoreStateProp,
    Token,
} from '@/modules/Builder/types'
import { DEFAULT_BUILDER_STORE_DATA, DEFAULT_BUILDER_STORE_STATE } from '@/modules/Builder/constants'
import { useWallet, WalletService } from '@/stores/WalletService'
import { TokenAbi } from '@/misc'
import { getTokenFromLocalStorage, saveTokenToLocalStorage } from '@/modules/Builder/utils'


export class BuilderStore {

    /**
     * Current data of the builder
     * @type {BuilderStoreData}
     * @protected
     */
    protected data: BuilderStoreData = DEFAULT_BUILDER_STORE_DATA

    /**
     * Current state of the builder store
     * @type {BuilderStoreState}
     * @protected
     */
    protected state: BuilderStoreState = DEFAULT_BUILDER_STORE_STATE

    /**
     *
     * @param wallet {WalletService}
     */
    constructor(protected readonly wallet: WalletService = useWallet()) {
        makeAutoObservable<BuilderStore, 'handleWalletAddressChange'>(this, {
            handleWalletAddressChange: action.bound,
        })
    }

    /**
     * Manually change store data by the given key
     * @template K
     * @param {K} key
     * @param {BuilderStoreData[k]} value
     */
    public changeData<K extends keyof BuilderStoreData>(key: K, value: BuilderStoreData[K]): void {
        this.data[key] = value
    }

    protected changeState<K extends keyof BuilderStoreState>(key: K, value: BuilderStoreState[K]): void {
        this.state[key] = value
    }

    public init(): void {
        this.#walletAccountDisposer = reaction(() => this.wallet.address, this.handleWalletAddressChange)

        if (this.wallet.address != null) {
            this.handleWalletAddressChange()
        }
    }

    /**
     * Manually dispose all of the internal subscribers.
     * Clean reset builder `data` to default values.
     */
    public dispose(): void {
        this.#walletAccountDisposer?.()
        this.reset()
    }

    public async filterTokens(): Promise<void> {
        try {
            this.changeState(BuilderStoreStateProp.IS_LOADING, false)

            if (this.data.filter === '') {
                await this.loadTokensData().then(tokens => {
                    this.changeData(BuilderStoreDataProp.TOKENS, tokens)
                })

                return
            }

            const token = await this.loadTokenData(this.data.filter)

            if (token && token.root_owner_address.toString() === this.wallet.address) {
                if (!getTokenFromLocalStorage().some((tokenFromLS: string) => tokenFromLS === this.data.filter)) {
                    saveTokenToLocalStorage(this.data.filter)
                }

                this.changeData(BuilderStoreDataProp.TOKENS, [
                    { ...token, name: atob(token.name), symbol: atob(token.symbol) },
                ])
            }
            else {
                this.changeData(BuilderStoreDataProp.TOKENS, [])
            }

            this.changeState(BuilderStoreStateProp.IS_LOADING, false)
        }
        catch (e) {
            this.changeData(BuilderStoreDataProp.TOKENS, [])
            this.changeState(BuilderStoreStateProp.IS_LOADING, false)
        }
    }

    protected async handleWalletAddressChange(walletAddress?: string, prevWalletAddress?: string): Promise<void> {
        if (!walletAddress || walletAddress !== prevWalletAddress) {
            this.reset()
        }

        await this.loadTokensData().then(tokens => {
            this.changeData(BuilderStoreDataProp.TOKENS, tokens)

        })
    }

    /**
     * Loads tokens data from localStorage
     * @protected
     */
    protected async loadTokensData(): Promise<(Token)[]> {
        const tokenRoots: string[] = getTokenFromLocalStorage().filter((token: string) => /^[0][:][0-9a-fA-F]{64}/.test(token))

        this.changeState(BuilderStoreStateProp.IS_LOADING, true)


        const tokens = (await Promise.all(tokenRoots.map(tokenRoot => this.loadTokenData(tokenRoot))))
            .map((token, index) => ({
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ...token, name: atob(token!.name), symbol: atob(token!.symbol), root: tokenRoots[index],
            }))
            .filter(
                token => Object.keys(token).length > 1
                    && token.root !== undefined
                    && token.root_owner_address?.toString() === this.wallet.address,
            ) as Token[]

        this.changeState(BuilderStoreStateProp.IS_LOADING, false)

        return tokens
    }

    /**
     * Loads token data by address
     * @protected
     */
    protected async loadTokenData(root: string): Promise<Token | undefined> {
        let state = this.data.tokensCache.get(root.toString())
        const address = new Address(root)
        const token = new Contract(TokenAbi.Root, address)

        if (!state) {
            state = (await ton.getFullContractState({ address })).state

            if (state) {
                this.data.tokensCache.set(root, state)
            }
            else {
                return undefined
            }
        }

        if (state.isDeployed) {
            const { value0 } = await token.methods
                .getDetails({ _answer_id: 0 })
                .call({ cachedState: state })

            return { ...value0, root }
        }

        return undefined
    }

    /**
     *
     * @protected
     */
    protected reset(): void {
        this.resetData()
    }

    /**
     *
     * @protected
     */
    protected resetData(): void {
        this.data = DEFAULT_BUILDER_STORE_DATA
    }

    /**
     *
     * @protected
     */
    protected resetState(): void {
        this.state = DEFAULT_BUILDER_STORE_STATE
    }

    public get tokens(): Token[] {
        return this.data.tokens
    }

    public get filter(): string {
        return this.data.filter
    }

    public get isLoading(): boolean {
        return this.state.isLoading
    }

    /*
     * Internal reaction disposers
     * ----------------------------------------------------------------------------------
     */
    #walletAccountDisposer: IReactionDisposer | undefined

}


const Builder = new BuilderStore()

export function useBuilderStore(): BuilderStore {
    return Builder
}
