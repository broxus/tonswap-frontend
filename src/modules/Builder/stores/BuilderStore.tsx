import {
    action,
    IReactionDisposer, makeAutoObservable, reaction, runInAction,
} from 'mobx'
import ton, { Address, Contract } from 'ton-inpage-provider'

import { BuilderStoreData, BuilderStoreState, Token } from '@/modules/Builder/types'
import { DEFAULT_BUILDER_STORE_DATA, DEFAULT_BUILDER_STORE_STATE } from '@/modules/Builder/constants'
import { useWallet, WalletService } from '@/stores/WalletService'
import { TokenAbi } from '@/misc'


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

    protected async handleWalletAddressChange(walletAddress?: string, prevWalletAddress?: string): Promise<void> {
        if (!walletAddress || walletAddress !== prevWalletAddress) {
            this.reset()
        }

        this.state.isLoading = true

        await this.loadTokensData().then(tokens => {
            runInAction(() => {
                this.data.tokens = tokens
            })
        })

        this.state.isLoading = false
    }

    /**
     * Loads tokens data from localStorage
     * @protected
     */
    protected async loadTokensData(): Promise<(Token)[]> {
        const tokenRoots: string[] = JSON.parse(localStorage.getItem('tokens') || '[]')
            .filter((token: Token) => !!token)

        return (await Promise.all(tokenRoots.map(tokenRoot => this.loadTokenData(tokenRoot))))
            .filter(token => !!token)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .map(token => ({ ...token, name: atob(token!.name), symbol: atob(token!.symbol) })) as Token[]
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

            return value0
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
