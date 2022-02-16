import { Mutex } from '@broxus/await-semaphore'
import {
    action,
    makeAutoObservable,
    reaction, runInAction,
} from 'mobx'
import { Address, Subscription } from 'everscale-inpage-provider'

import { useRpcClient } from '@/hooks/useRpcClient'
import {
    DexConstants,
    isAddressValid,
    Token,
    TokenWallet,
} from '@/misc'
import { TokensListService, useTokensList } from '@/stores/TokensListService'
import { useWallet, WalletService } from '@/stores/WalletService'
import { debug, error, storage } from '@/utils'


export type TokenCache = Token

export type TokensCacheData = {
    customTokens: TokenCache[];
    tokens: TokenCache[];
}

export type TokensCacheState = {
    isImporting: boolean;
    queue: TokenCache[];
    updatingTokens: Map<string, boolean>;
    updatingTokensBalance: Map<string, boolean>;
    updatingTokensWallet: Map<string, boolean>;
}

export type TokensCacheCtorConfig = {
    withImportedTokens: boolean;
}


const rpc = useRpcClient()


export const IMPORTED_TOKENS_STORAGE_KEY = 'imported_tokens'


export function getImportedTokens(): string[] {
    return JSON.parse(storage.get(IMPORTED_TOKENS_STORAGE_KEY) || '[]')
}


export class TokensCacheService {

    /**
     * Current data of the tokens cache
     * @type {TokensCacheData}
     * @protected
     */
    protected data: TokensCacheData = {
        customTokens: [],
        tokens: [],
    }

    protected state: TokensCacheState = {
        isImporting: false,
        queue: [],
        updatingTokens: new Map<string, boolean>(),
        updatingTokensBalance: new Map<string, boolean>(),
        updatingTokensWallet: new Map<string, boolean>(),
    }

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensList: TokensListService,
        protected readonly config?: TokensCacheCtorConfig,
    ) {
        makeAutoObservable(this, {
            add: action.bound,
            addCustomToken: action.bound,
            onImportConfirm: action.bound,
            onImportDismiss: action.bound,
        })

        // When the Tokens List Service has loaded the list of
        // available tokens, we will start creating a token map
        reaction(
            () => [this.tokensList.time, this.tokensList.tokens, this.wallet.address],
            async (
                [time, tokens, address],
                [prevTime, prevTokens, prevAddress],
            ) => {
                if (time !== prevTime || tokens !== prevTokens || address !== prevAddress) {
                    await this.build()
                }
            },
            { delay: 100 },
        )

        tokensList.fetch(DexConstants.TokenListURI)

        this.#tokensBalancesSubscribers = new Map<string, Subscription<'contractStateChanged'>>()
        this.#tokensBalancesSubscribersMutex = new Mutex()
    }

    /**
     * Create a tokens list based on the loaded list of
     * tokens in the related `TokensListCache` service.
     * @protected
     */
    protected async build(): Promise<void> {
        if (this.tokensList.tokens.length === 0) {
            return
        }

        this.data.tokens = this.tokensList?.tokens.map(token => ({
            balance: undefined,
            decimals: token.decimals,
            icon: token.logoURI,
            name: token.name,
            root: token.address,
            symbol: token.symbol,
            updatedAt: -1,
            wallet: undefined,
        }))

        if (this.config?.withImportedTokens) {
            const importedTokens = getImportedTokens()

            if (importedTokens.length > 0) {
                importedTokens.forEach(root => {
                    this.add({ root } as TokenCache)
                })

                const results = await Promise.allSettled(
                    importedTokens.map(root => TokenWallet.getTokenFullDetails(root)),
                ).then(response => response.map(
                    r => (r.status === 'fulfilled' ? r.value : undefined),
                ).filter(e => e !== undefined)) as TokenCache[]

                results.forEach(this.add)
            }
        }
    }

    /**
     * Returns tokens map where key is a token root address.
     * @protected
     */
    protected get _byRoot(): Record<string, TokenCache> {
        const entries: Record<string, TokenCache> = {}
        this.tokens.forEach(token => {
            entries[token.root] = token
        })
        this.customTokens.forEach(token => {
            entries[token.root] = token
        })
        return entries
    }

    /**
     * Returns list of the cached tokens list.
     * @returns {TokenCache[]}
     */
    public get tokens(): TokenCache[] {
        return this.data.tokens
    }

    /**
     * Returns list of the cached tokens root addresses.
     * @returns {string[]}
     */
    public get roots(): string[] {
        return this.tokens.map(token => token.root)
    }

    /**
     * Returns token by the given token root address.
     * @param {string} [root]
     * @returns {TokenCache}
     */
    public get(root?: string): TokenCache | undefined {
        if (root === undefined) {
            return undefined
        }
        return this._byRoot[root]
    }

    /**
     * Check if token was stored to the cache.
     * @param {string} [root]
     * @returns {boolean}
     */
    public has(root?: string): boolean {
        return this.get(root) !== undefined
    }

    /**
     * Add a new token to the tokens list.
     * @param {TokenCache} token
     */
    public add(token: TokenCache): void {
        const tokens = this.tokens.slice()
        const index = tokens.findIndex(item => item.root === token.root)
        if (index > -1) {
            tokens[index] = {
                ...tokens[index],
                ...token,
            }
        }
        else {
            tokens.push(token)
        }
        this.data.tokens = tokens
    }

    /**
     * Remove a given token from the tokens list.
     * @param {TokenCache} token
     */
    public remove(token: TokenCache): void {
        this.data.tokens = this.tokens.filter(item => item.root !== token.root)
    }

    /**
     * Update token field by the given root address, key and value.
     * @template {K extends keyof TokenCache & string} K
     * @param {string} root
     * @param {K} key
     * @param {TokenCache[K]} value
     */
    public update<K extends keyof TokenCache & string>(root: string, key: K, value: TokenCache[K]): void {
        const token = this.get(root)
        if (token !== undefined) {
            token[key] = value
        }
    }

    /**
     *
     * @returns {TokenCache[]}
     */
    public get customTokens(): TokenCache[] {
        return this.data.customTokens
    }

    /**
     * Import custom token to the list.
     * Saves token root address to the localStorage.
     * @param {TokenCache} token
     */
    public import(token: TokenCache): void {
        try {
            const importedTokens = getImportedTokens()
            if (!importedTokens.includes(token.root)) {
                importedTokens.push(token.root)
                storage.set(IMPORTED_TOKENS_STORAGE_KEY, JSON.stringify(importedTokens))
            }
            this.add(token)
            this.removeCustomToken(token)
        }
        catch (e) {
            error('Can\'t import token', e)
        }
    }

    /**
     * Add a new custom token to the custom tokens list.
     * @param {TokenCache} token
     */
    public addCustomToken(token: TokenCache): void {
        const customTokens = this.customTokens.slice()
        const index = customTokens.findIndex(item => item.root === token.root)
        if (index > -1) {
            customTokens[index] = {
                ...customTokens[index],
                ...token,
            }
        }
        else {
            customTokens.push(token)
        }

        this.data.customTokens = customTokens
    }

    /**
     * Remove a given custom token from the custom tokens list.
     * @param {TokenCache} token
     */
    public removeCustomToken(token: TokenCache): void {
        this.data.customTokens = this.customTokens.filter(item => item.root !== token.root)
    }

    public get isImporting(): TokensCacheState['isImporting'] {
        return this.state.isImporting
    }

    public get queue(): TokensCacheState['queue'] {
        return this.state.queue
    }

    public get currentImportingToken(): TokenCache | undefined {
        return this.queue.slice().shift()
    }

    public async addToImportQueue(root?: string): Promise<void> {
        if (root === undefined || !isAddressValid(root)) {
            return
        }

        try {
            runInAction(() => {
                this.state.isImporting = true
            })
            const customToken = await TokenWallet.getTokenFullDetails(root)
            if (customToken) {
                const filtered = this.queue.filter(token => token.root !== root)
                filtered.push(customToken)
                runInAction(() => {
                    this.state.queue = filtered
                })
            }
        }
        catch (e) {
            error(e)
            runInAction(() => {
                this.state.isImporting = this.queue.length > 0
            })
        }
    }

    public isTokenUpdating(root: string): boolean {
        return this.state.updatingTokens.get(root) || false
    }

    public isTokenUpdatingBalance(root: string): boolean {
        return this.state.updatingTokensBalance.get(root) || false
    }

    public isTokenUpdatingWallet(root: string): boolean {
        return this.state.updatingTokensWallet.get(root) || false
    }

    public onImportDismiss(): void {
        const queue = this.queue.slice()
        queue.shift()
        runInAction(() => {
            this.state.queue = queue
            this.state.isImporting = queue.length > 0
        })
    }

    public onImportConfirm(token: TokenCache): void {
        this.import(token)
        const queue = this.queue.slice()
        queue.shift()
        runInAction(() => {
            this.state.queue = queue
            this.state.isImporting = queue.length > 0
        })
    }

    /**
     * @param {string} root
     * @returns {Promise<void>}
     */
    public async syncCustomToken(root: string): Promise<void> {
        try {
            if (this.has(root)) {
                return
            }

            const token = await TokenWallet.getTokenFullDetails(root)

            if (token === undefined || this.has(token.root)) {
                return
            }

            this.addCustomToken(token)
        }
        catch (e) {
            error('Sync custom token error', e)
        }
    }

    /**
     * Search token by the given query string.
     * Query string can be a token symbol, name or address.
     * @param {string} query
     * @returns {Promise<TokenCache[]>}
     */
    public async search(query: string): Promise<TokenCache[]> {
        const filtered = this.tokens.filter(token => (
            token.symbol?.toLowerCase?.().includes(query?.toLowerCase?.())
            || token.name?.toLowerCase?.().includes(query?.toLowerCase?.())
            || token.root?.toLowerCase?.().includes(query?.toLowerCase?.())
        ))

        if (filtered.length === 0 && isAddressValid(query)) {
            try {
                const token = await TokenWallet.getTokenFullDetails(query)
                if (token !== undefined) {
                    filtered.push(token)
                }
            }
            catch (e) {}
        }

        return filtered
    }

    /**
     * Sync token balance with balance in network by the given token root address.
     * Pass `true` in second parameter to force update.
     * @param {string} root
     * @param {boolean} force
     * @returns {Promise<void>}
     */
    public async syncToken(root: string, force?: boolean): Promise<void> {
        if (this.wallet.address === undefined) {
            return
        }

        const token = this.get(root)

        if (
            token === undefined
            || (!force && (this.isTokenUpdating(root) || Date.now() - (token.updatedAt || 0) < 60 * 1000))
        ) {
            return
        }

        this.state.updatingTokens.set(root, true)

        if (token.wallet === undefined && !this.isTokenUpdatingWallet(root)) {
            try {
                await this.updateTokenWalletAddress(root)
            }
            catch (e) {
                error('Sync token wallet address error', e)
                this.update(root, 'wallet', undefined)
            }
        }

        if (token.wallet !== undefined && !this.isTokenUpdatingBalance(root)) {
            try {
                await this.updateTokenBalance(root)
            }
            catch (e) {
                error('Sync token balance error', e)
                this.update(root, 'balance', undefined)
            }
        }

        this.update(root, 'updatedAt', Date.now())
        this.state.updatingTokens.set(root, false)
    }

    /**
     * Start to watch token balance updates by the given token root address.
     * @param {string} root
     * @param {string} prefix
     * @returns {Promise<void>}
     */
    public async watch(root: string, prefix: string): Promise<void> {
        if (this.wallet.address === undefined) {
            return
        }

        const token = this.get(root)

        if (token === undefined) {
            return
        }

        try {
            await this.syncToken(root)
        }
        catch (e) {}

        if (token.wallet !== undefined) {
            const key = `${prefix}-${root}`

            await this.#tokensBalancesSubscribersMutex.use(async () => {
                const entry = this.#tokensBalancesSubscribers.get(key)

                if (entry != null || token.wallet === undefined) {
                    return
                }

                const address = new Address(token.wallet)

                const subscription = (await rpc.subscribe('contractStateChanged', {
                    address,
                })).on('data', async event => {
                    debug(
                        '%cTON Provider%c The token\'s `contractStateChanged` event was captured',
                        'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
                        'color: #c5e4f3',
                        event,
                    )
                    await this.syncToken(root)
                })

                this.#tokensBalancesSubscribers.set(key, subscription)

                debug(
                    `%cTON Provider%c Subscribe to a token %c${token.symbol}%c wallet (%c${token.wallet}%c) balance updates.
               Key: (${key})`,
                    'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
                    'color: #c5e4f3',
                    'color: #bae701',
                    'color: #c5e4f3',
                    'color: #bae701',
                    'color: #c5e4f3',
                )
            })
        }
    }

    /**
     * Stop watching token balance updates by the given token root address.
     * @param {string} root
     * @param {string} prefix
     * @returns {Promise<void>}
     */
    public async unwatch(root: string, prefix: string): Promise<void> {
        if (this.wallet.address === undefined) {
            return
        }

        const token = this.get(root)

        if (token === undefined) {
            return
        }

        const key = `${prefix}-${token.root}`

        await this.#tokensBalancesSubscribersMutex.use(async () => {
            const subscriber = this.#tokensBalancesSubscribers.get(key)

            try {
                await subscriber?.unsubscribe()
            }
            catch (e) {
                error('Cannot unsubscribe from token balance update', e)
            }

            this.#tokensBalancesSubscribers.delete(key)

            debug(
                `%cTON Provider%c Unsubscribe to a token %c${token.symbol}%c wallet (%c${token.wallet}%c) balance updates.
                Key: (${key})`,
                'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
                'color: #c5e4f3',
                'color: #bae701',
                'color: #c5e4f3',
                'color: #bae701',
                'color: #c5e4f3',
            )
        })
    }

    /**
     * Directly update token balance by the given token root address.
     * It updates balance in the tokens list.
     * @param {string} root
     */
    public async updateTokenBalance(root: string): Promise<void> {
        if (root === undefined || this.wallet.account?.address === undefined || this.isTokenUpdatingBalance(root)) {
            return
        }

        const token = this.get(root)

        if (token === undefined || token.wallet === undefined) {
            return
        }

        try {
            this.state.updatingTokensBalance.set(root, true)

            const balance = await TokenWallet.balance({
                wallet: new Address(token.wallet),
            })

            this.update(root, 'balance', balance)
        }
        catch (e) {
            error('Token balance update error', e)
            this.update(root, 'balance', undefined)
        }
        finally {
            this.state.updatingTokensBalance.set(root, false)
        }
    }

    /**
     * Update token wallet address by the given token root address and current wallet address.
     * @param {string} root
     * @returns {Promise<void>}
     */
    public async updateTokenWalletAddress(root: string): Promise<void> {
        if (root === undefined || this.wallet.account?.address === undefined || this.isTokenUpdatingWallet(root)) {
            return
        }

        const token = this.get(root)

        if (token === undefined) {
            return
        }

        if (token.wallet === undefined) {
            this.state.updatingTokensWallet.set(root, true)

            try {
                const address = await TokenWallet.walletAddress({
                    owner: this.wallet.account.address,
                    root: new Address(token.root),
                })

                this.update(root, 'wallet', address.toString())
            }
            catch (e) {
                error('Token wallet address update error', e)
            }
            finally {
                this.state.updatingTokensWallet.set(root, false)
            }
        }
    }

    /**
     * TON Subscription for the contract state changes.
     * @type {Map<string, Subscription<'contractStateChanged'>>}
     * @private
     */
    #tokensBalancesSubscribers: Map<string, Subscription<'contractStateChanged'>>

    /**
     * Subscribers map mutex. Used to prevent duplicate subscriptions
     * @type Mutex
     * @private
     */
    #tokensBalancesSubscribersMutex: Mutex

}


const TokensCacheServiceStore = new TokensCacheService(
    useWallet(),
    useTokensList(),
    { withImportedTokens: true },
)

export function useTokensCache(): TokensCacheService {
    return TokensCacheServiceStore
}
