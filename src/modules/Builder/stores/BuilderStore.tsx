import {
    action,
    IReactionDisposer,
    makeAutoObservable,
    reaction,
} from 'mobx'
import ton, { Address, Contract } from 'ton-inpage-provider'

import { CustomToken, isAddressValid, TokenAbi } from '@/misc'
import {
    BuilderStoreData,
    BuilderStoreState,
} from '@/modules/Builder/types'
import { DEFAULT_BUILDER_STORE_DATA, DEFAULT_BUILDER_STORE_STATE } from '@/modules/Builder/constants'
import { getTokenFromLocalStorage, saveTokenToLocalStorage } from '@/modules/Builder/utils'
import { useWallet, WalletService } from '@/stores/WalletService'


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
            this.changeState('isLoading', true)

            if (this.data.filter === '') {
                const tokens = await this.loadTokensData()
                this.changeData('tokens', tokens)
                return
            }

            const token = await this.loadTokenData(this.data.filter)

            if (token && token.root_owner_address.toString() === this.wallet.address) {
                if (
                    !getTokenFromLocalStorage().some(
                        (tokenFromLS: string) => tokenFromLS === this.data.filter,
                    )
                ) {
                    saveTokenToLocalStorage(this.data.filter)
                }

                this.changeData('tokens', [
                    {
                        ...token,
                        name: atob(token.name),
                        symbol: atob(token.symbol),
                    },
                ])
            }
            else {
                this.changeData('tokens', [])
            }
        }
        catch (e) {
            this.changeData('tokens', [])
        }
        finally {
            this.changeState('isLoading', false)
        }
    }

    protected async handleWalletAddressChange(walletAddress?: string, prevWalletAddress?: string): Promise<void> {
        if (!walletAddress || walletAddress !== prevWalletAddress) {
            this.reset()
        }

        try {
            const tokens = await this.loadTokensData()
            this.changeData('tokens', tokens)
        }
        catch (e) {}
    }

    /**
     * Loads tokens data from localStorage
     * @protected
     */
    protected async loadTokensData(): Promise<CustomToken[]> {
        const tokenRoots: string[] = getTokenFromLocalStorage().filter(
            (token: string) => isAddressValid(token),
        )

        this.changeState('isLoading', true)

        let tokens: CustomToken[] = []

        try {
            const result = await Promise.all(tokenRoots.map(tokenRoot => this.loadTokenData(tokenRoot)))
            tokens = (result.filter((token, idx) => {
                const _token = { ...token, root: tokenRoots[idx] }
                return (
                    Object.keys({ ..._token }).length > 1
                    && _token?.root !== undefined
                    && _token.root_owner_address?.toString() === this.wallet.address
                )
            }) as CustomToken[]).map(token => ({
                ...token,
                name: atob(token.name),
                symbol: atob(token.symbol),
            }))
        }
        catch (e) {}
        finally {
            this.changeState('isLoading', false)
        }

        return tokens
    }

    /**
     * Loads token data by address
     * @protected
     */
    protected async loadTokenData(root: string): Promise<CustomToken | undefined> {
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

            return { ...value0, root } as unknown as CustomToken
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

    public get tokens(): CustomToken[] {
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
