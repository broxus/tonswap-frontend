import {
    ObservableMap,
    makeAutoObservable,
    reaction,
    runInAction,
} from 'mobx'
import ton, { Address, Subscription } from 'ton-inpage-provider'

import { TokenWallet } from '@/misc/token-wallet'
import { WalletService, useWallet } from '@/stores/WalletService'
import { TokensListService, useTokensList } from '@/stores/TokensListService'
import { log } from '@/utils'


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
     *
     * @protected
     */
    protected data: TokensCacheData = {
        tokens: [],
        tokensMap: new ObservableMap<string, TokenCache>(),
    }

    /**
     *
     * @private
     */
    #tokensBalancesSubscribers: Map<string, Subscription<'contractStateChanged'>>

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensList: TokensListService,
    ) {
        makeAutoObservable(this)

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
    }

    /**
     *
     * @private
     */
    private build(): void {
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
     *
     * @private
     */
    private invalidate(): void {
        this.data.tokens = []
    }

    /**
     *
     */
    public get tokens(): TokenCache[] {
        return this.data.tokens
    }

    /**
     *
     * @param {string} key
     * @returns {TokenCache}
     */
    public get(key: string): TokenCache | undefined {
        return this.data.tokensMap.get(key)
    }

    /**
     *
     * @param {TokenCache} token
     */
    public store(token: TokenCache): void {
        this.data.tokens.push(token)
    }

    /**
     *
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
     *
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
     *
     * @param {string} root
     * @returns {Promise<void>}
     */
    public async watch(root: string): Promise<void> {
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
            const hasSubscriber = this.#tokensBalancesSubscribers.has(token.root)

            if (hasSubscriber) {
                try {
                    this.#tokensBalancesSubscribers.get(token.root)?.unsubscribe()
                    this.#tokensBalancesSubscribers.delete(token.root)
                }
                catch (e) {
                    log('Cannot subscribe on token balance update', e)
                }
            }

            const address = new Address(token.wallet)

            this.#tokensBalancesSubscribers.set(
                token.root,
                (await ton.subscribe('contractStateChanged', {
                    address,
                })).on('data', async () => {
                    try {
                        const balance = await TokenWallet.balance({
                            wallet: address,
                        })
                        this.updateTokenBalance(token.root, balance)
                    }
                    catch (e) {}
                }),
            )

            log(
                `%cTON Provider%c Subscribe to a token %c${token.symbol}%c wallet (%c${token.wallet}%c) balance updates`,
                'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
                'color: #c5e4f3',
                'color: #bae701',
                'color: #c5e4f3',
                'color: #bae701',
                'color: #c5e4f3',
            )
        }
    }

    /**
     *
     * @param {string} root
     * @returns {Promise<void>}
     */
    public async unwatch(root: string): Promise<void> {
        if (!this.wallet.address) {
            return
        }

        const token = this.tokens.find(t => t.root === root)

        if (!token) {
            return
        }

        const subscriber = this.#tokensBalancesSubscribers.get(token.root)

        try {
            await subscriber?.unsubscribe()
        }
        catch (e) {
            log('Cannot unsubscribe from token balance update', e)
        }

        this.#tokensBalancesSubscribers.delete(token.root)

        log(
            `%cTON Provider%c Unsubscribe to a token %c${token.symbol}%c wallet (%c${token.wallet}%c) balance updates`,
            'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
            'color: #c5e4f3',
            'color: #bae701',
            'color: #c5e4f3',
            'color: #bae701',
            'color: #c5e4f3',
        )
    }

    /**
     *
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

            const walletTokenAddress = await TokenWallet.walletAddress({
                owner: new Address(walletAddress),
                root: new Address(token.root),
            })

            runInAction(() => {
                token.wallet = walletTokenAddress.toString?.()
                token.isUpdatingWalletAddress = true
            })
        }
    }

}


const TokensCacheServiceStore = new TokensCacheService(
    useWallet(),
    useTokensList(),
)

export function useTokensCache(): TokensCacheService {
    return TokensCacheServiceStore
}
