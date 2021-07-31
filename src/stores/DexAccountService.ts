import {
    IReactionDisposer,
    makeAutoObservable,
    reaction,
    runInAction,
} from 'mobx'
import { Address, TransactionId } from 'ton-inpage-provider'

import { Dex, getDexAccount } from '@/misc'
import { useWallet, WalletService } from '@/stores/WalletService'


export type DexAccountData = {
    address?: string;
    balances?: Map<string, string>;
    nonce?: string;
    wallets?: Map<string, Address>;
}


const DEFAULT_DEX_ACCOUNT_DATA: DexAccountData = {
    address: undefined,
    balances: undefined,
    wallets: undefined,
}


export class DexAccountService {

    /**
     * Current data of the DEX account
     * @type {DexAccountData}
     * @protected
     */
    protected data: DexAccountData = DEFAULT_DEX_ACCOUNT_DATA

    constructor(protected readonly wallet: WalletService) {
        makeAutoObservable(this)

        this.#walletAccountDisposer = reaction(() => this.wallet.address, () => {
            this.data = DEFAULT_DEX_ACCOUNT_DATA
        })
    }

    /**
     * Manually connect to the DEX account.
     * @returns {Promise<void>}
     */
    public async connect(): Promise<void> {
        if (!this.wallet.address) {
            return
        }

        const address = await getDexAccount(this.wallet.address)

        runInAction(() => {
            this.data.address = address
        })
    }

    /**
     * Manually create DEX account
     * @returns {Promise<TransactionId | undefined>}
     */
    public async create(): Promise<TransactionId | undefined> {
        if (!this.wallet.address) {
            return undefined
        }

        return Dex.createAccount(new Address(this.wallet.address))
    }

    /**
     * Try to connect to the DEX account, else create a new one
     * @returns {Promise<void>}
     */
    public async connectOrCreate(): Promise<void> {
        if (!this.wallet.address) {
            return
        }

        await this.connect()

        if (!this.address) {
            await this.create()
        }

        await this.connect()
    }

    /**
     * Connect to the DEX account and sync nonce, balances, and run balances updater
     * @returns {Promise<void>}
     */
    public async connectAndSync(): Promise<void> {
        if (!this.wallet.address) {
            return
        }

        await this.connect()

        if (!this.address) {
            return
        }

        await this.syncNonce()
        await this.syncBalances()
        this.runBalancesUpdater()
    }

    /**
     * Sync DEX account balances
     * @returns {Promise<void>}
     */
    public async syncBalances(): Promise<void> {
        if (!this.wallet.account || !this.address) {
            return
        }

        const balances = await Dex.accountBalances(new Address(this.address))

        runInAction(() => {
            this.data.balances = balances
        })
    }

    /**
     * Sync DEX account wallets
     * @returns {Promise<void>}
     */
    public async syncWallets(): Promise<void> {
        if (!this.wallet.account || !this.address) {
            return
        }

        const wallets = await Dex.accountWallets(new Address(this.address))

        runInAction(() => {
            this.data.wallets = wallets
        })
    }

    /**
     * Withdraw token by the given root address and amount
     * @param {string} root
     * @param {string} amount
     * @returns {Promise<void>}
     */
    public async withdrawToken(root: string, amount: string): Promise<void> {
        if (!this.wallet.address || !this.address || !root || !amount) {
            return
        }

        await Dex.withdrawAccountTokens(
            new Address(this.address),
            new Address(root),
            new Address(this.wallet.address),
            amount,
        )
    }

    /**
     * Returns account wallet by the given account root address
     * @param {string} root
     */
    public getAccountWallet(root: string | undefined): Address | undefined {
        if (!root) {
            return undefined
        }
        return this.wallets?.get(root)
    }

    /**
     * Returns DEX account address
     */
    public get address(): DexAccountData['address'] {
        return this.data.address
    }

    /**
     * Returns map of the DEX account balances
     */
    public get balances(): DexAccountData['balances'] {
        return this.data.balances
    }

    /**
     * Returns nonce value
     */
    public get nonce(): DexAccountData['nonce'] {
        return this.data.nonce
    }

    /**
     * Returns map of the DEX account wallets
     */
    public get wallets(): DexAccountData['wallets'] {
        return this.data.wallets
    }

    /**
     *
     */
    public stopBalancesUpdater(): void {
        if (this.#balancesInterval !== undefined) {
            clearInterval(this.#balancesInterval)
            this.#balancesInterval = undefined
        }
    }

    /**
     * @protected
     */
    protected runBalancesUpdater(): void {
        this.stopBalancesUpdater()

        this.#balancesInterval = setInterval(async () => {
            await this.syncBalances()
        }, 5000)
    }

    /**
     * Sync DEX account nonce
     * @protected
     * @returns {Promise<void>}
     */
    protected async syncNonce(): Promise<void> {
        if (!this.address) {
            return
        }

        const nonce = await Dex.accountNonce(new Address(this.address))

        runInAction(() => {
            this.data.nonce = (parseInt(nonce, 10) + 1).toString()
        })
    }

    /**
     *
     * @private
     */
    #walletAccountDisposer: IReactionDisposer | undefined

    /**
     *
     * @private
     */
    #balancesInterval: ReturnType<typeof setInterval> | undefined

}


const DexAccount = new DexAccountService(useWallet())

export function useDexAccount(): DexAccountService {
    return DexAccount
}
