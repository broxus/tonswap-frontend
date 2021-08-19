import { Mutex } from '@broxus/await-semaphore'
import {
    makeAutoObservable,
    reaction,
    runInAction,
} from 'mobx'
import ton, { Address, Subscription } from 'ton-inpage-provider'

import { isAddressValid, TokenWallet } from '@/misc'
import { TokensListService, useTokensList } from '@/stores/TokensListService'
import { useWallet, WalletService } from '@/stores/WalletService'
import { debug, error, storage } from '@/utils'


export type TokenCache = {
    balance?: string;
    decimals: number;
    icon?: string;
    isUpdating: boolean;
    isUpdatingWalletAddress: boolean;
    name: string;
    root: string;
    symbol: string;
    updatedAt: number;
    wallet?: string;
}

export type TokensCacheData = {
    tokens: TokenCache[];
    tokensMap: Record<string, TokenCache>;
}

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
        tokens: [],
        tokensMap: {},
    }

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensList: TokensListService,
    ) {
        makeAutoObservable(this)

        // When the Tokens List Service has loaded the list of
        // available tokens, we will start creating a token map
        reaction(
            () => [this.tokensList.time, this.wallet.address],
            async (
                [time, address],
                [prevTime, prevAddress],
            ) => {
                if (time !== prevTime || address !== prevAddress) {
                    await this.build()
                }
            },
            { delay: 100 },
        )

        // Update tokens map when tokens list was changed
        reaction(() => this.tokens, tokens => {
            if (tokens.length === 0) {
                this.data.tokensMap = {}
                return
            }

            const entries: TokensCacheData['tokensMap'] = {}
            tokens.forEach(token => {
                entries[token.root] = token
            })
            this.data.tokensMap = entries
        })

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

        const tokens: TokenCache[] = []

        this.tokensList?.tokens.forEach(token => {
            const cache: TokenCache = {
                balance: undefined,
                decimals: token.decimals,
                icon: token.logoURI,
                isUpdating: false,
                isUpdatingWalletAddress: false,
                name: token.name,
                root: token.address,
                symbol: token.symbol,
                updatedAt: -1,
                wallet: undefined,
            }
            tokens.push(cache)
        })

        const importedTokens = getImportedTokens()

        if (importedTokens.length > 0) {
            const results = await Promise.all(importedTokens.map(root => TokenWallet.getTokenData(root)))
            tokens.push(...results as unknown as TokenCache[])
        }

        runInAction(() => {
            this.data.tokens = tokens
        })
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
     * Returns token by the given key.
     * @param {string} key
     * @returns {TokenCache}
     */
    public get(key: string): TokenCache | undefined {
        return this.data.tokensMap[key]
    }

    /**
     * Add a new token to the tokens list.
     * @param {TokenCache} token
     */
    public store(token: TokenCache): void {
        const tokens = this.tokens.slice()
        tokens.push(token)
        this.data.tokens = tokens
    }

    /**
     * Check if token was stored to the cache.
     * @param {string} root
     * @returns {boolean}
     */
    public isStored(root: string): boolean {
        return this.get(root) !== undefined
    }

    /**
     * Search token by the given query string.
     * Query string can be a token symbol, name or address.
     * @param {string} query
     * @returns {TokenCache[]}
     */
    public async search(query: string): Promise<TokenCache[]> {
        const filtered = this.tokens.filter(token => (
            token.symbol?.toLowerCase?.().indexOf(query?.toLowerCase?.()) > -1
            || token.name?.toLowerCase?.().indexOf(query?.toLowerCase?.()) > -1
            || token.root?.toLowerCase?.().indexOf(query?.toLowerCase?.()) > -1
        ))

        if (filtered.length === 0 && isAddressValid(query)) {
            const token = await TokenWallet.getTokenData(query)
            if (token !== undefined) {
                filtered.push(token as unknown as TokenCache)
            }
        }

        return filtered
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
            this.store(token)
        }
        catch (e) {
            error('Can\'t import token', e)
        }
    }

    /**
     * Directly update token balance by the given token root address.
     * It updates balance in the tokens list.
     * @param {string} root
     * @param {string} balance
     */
    public updateTokenBalance(root: string, balance: string | undefined): void {
        const token = this.tokens.find(t => t.root === root)
        if (token) {
            token.balance = balance
        }
    }

    /**
     * Sync token balance with balance in network by the given token root address.
     * @param {string} root
     * @returns {Promise<void>}
     */
    public async syncToken(root: string): Promise<void> {
        if (!this.wallet.address) {
            return
        }

        const token = this.tokens.find(t => t.root === root)

        if (!token || token.isUpdating || (Date.now() - token.updatedAt < 60 * 1000)) {
            return
        }

        runInAction(() => {
            token.isUpdating = true
        })

        if (!token.wallet && !token.isUpdatingWalletAddress) {
            try {
                await this.updateTokenWalletAddress(token.root, this.wallet.address)
            }
            catch (e) {
                error('Update token wallet address error', e)
            }
        }

        if (token.wallet) {
            try {
                const walletTokenBalance = await TokenWallet.balance({
                    wallet: new Address(token.wallet),
                })
                this.updateTokenBalance(token.root, walletTokenBalance)
            }
            catch (e) {
                error('Update token balance error', e)
                this.updateTokenBalance(token.root, undefined)
            }
        }

        runInAction(() => {
            token.updatedAt = Date.now()
            token.isUpdating = false
        })
    }

    /**
     * Start to watch token balance updates by the given token root address.
     * @param {string} root
     * @param {string} prefix
     * @returns {Promise<void>}
     */
    public async watch(root: string, prefix: string): Promise<void> {
        if (!this.wallet.address) {
            return
        }

        const token = this.tokens.find(t => t.root === root)

        if (!token) {
            return
        }

        if (!token.wallet && !token.isUpdatingWalletAddress) {
            try {
                await this.updateTokenWalletAddress(token.root, this.wallet.address)
            }
            catch (e) {}
        }

        if (token.wallet) {
            const key = `${prefix}-${token.root}`

            await this.#tokensBalancesSubscribersMutex.use(async () => {
                const entry = this.#tokensBalancesSubscribers.get(key)
                if (entry != null || !token.wallet) {
                    return
                }

                const address = new Address(token.wallet)

                const subscription = (await ton.subscribe('contractStateChanged', {
                    address,
                })).on('data', async event => {
                    debug(
                        '%cTON Provider%c The token\'s `contractStateChanged` event was captured',
                        'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
                        'color: #c5e4f3',
                        event,
                    )
                    await this.syncToken(token.root)
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
        if (!this.wallet.address) {
            return
        }

        const token = this.tokens.find(t => t.root === root)

        if (!token) {
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
     * Update token wallet address by the given token root address and current wallet address.
     * @param {string} root
     * @param {string} walletAddress
     * @returns {Promise<void>}
     */
    protected async updateTokenWalletAddress(root: string, walletAddress: string): Promise<void> {
        if (!root || !walletAddress) {
            return
        }

        const token = this.tokens.find(t => t.root === root)

        if (!token) {
            return
        }

        if (!token.wallet) {
            runInAction(() => {
                token.isUpdatingWalletAddress = true
            })

            try {
                const address = await TokenWallet.walletAddress({
                    owner: new Address(walletAddress),
                    root: new Address(token.root),
                })

                runInAction(() => {
                    token.wallet = address.toString()
                })
            }
            catch (e) {}
            finally {
                runInAction(() => {
                    token.isUpdatingWalletAddress = false
                })
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
)

export function useTokensCache(): TokensCacheService {
    return TokensCacheServiceStore
}
