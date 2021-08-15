import { Mutex } from '@broxus/await-semaphore'
import {
    makeAutoObservable,
    ObservableMap,
    reaction,
    runInAction,
} from 'mobx'
import ton, { Address, Subscription } from 'ton-inpage-provider'

import { TokenWallet } from '@/misc/token-wallet'
import { TokensListService, useTokensList } from '@/stores/TokensListService'
import { useWallet, WalletService } from '@/stores/WalletService'
import { debug, error } from '@/utils'


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
    tokensMap: ObservableMap<string, TokenCache>;
}


export class TokensCacheService {

    /**
     * Current data of the tokens cache
     * @type {TokensCacheData}
     * @protected
     */
    protected data: TokensCacheData = {
        tokens: [],
        tokensMap: new ObservableMap<string, TokenCache>(),
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
            (
                [time, address],
                [prevTime, prevAddress],
            ) => {
                if (time !== prevTime || address !== prevAddress) {
                    this.build()
                }
            },
            { delay: 100 },
        )

        // Update tokens map when tokens list was changed
        reaction(() => this.data.tokens, tokens => {
            if (tokens.length === 0) {
                this.data.tokensMap.clear()
                return
            }

            const entries: [string, TokenCache][] = []
            tokens.forEach(token => {
                entries.push([token.root, token])
            })
            this.data.tokensMap.replace(entries)
        })

        this.#tokensBalancesSubscribers = new Map<string, Subscription<'contractStateChanged'>>()
        this.#tokensBalancesSubscribersMutex = new Mutex()
    }

    /**
     * Create a tokens list based on the loaded list of
     * tokens in the related `TokensListCache` service.
     * @private
     */
    protected build(): void {
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

        this.data.tokens = tokens
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
        return this.data.tokensMap.get(key)
    }

    /**
     * Add a new token to the tokens list.
     * @param {TokenCache} token
     */
    public store(token: TokenCache): void {
        this.data.tokens.push(token)
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
            catch (e) {}
        }

        if (token.wallet) {
            try {
                const walletTokenBalance = await TokenWallet.balance({
                    wallet: new Address(token.wallet),
                })
                this.updateTokenBalance(token.root, walletTokenBalance)
            }
            catch (e) {
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
    private async updateTokenWalletAddress(root: string, walletAddress: string): Promise<void> {
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
