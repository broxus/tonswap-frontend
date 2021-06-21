import {
    IReactionDisposer,
    makeAutoObservable,
    reaction,
    runInAction,
} from 'mobx'
import { Address, TransactionId } from 'ton-inpage-provider'

import { Dex, getDexAccount } from '@/misc'
import { useWallet, WalletService } from '@/stores/WalletService'


export enum DexAccountDataProp {
    ADDRESS = 'address',
    BALANCES = 'balances',
    NONCE = 'nonce',
    WALLETS = 'wallets',
}

export type DexAccountData = {
    [DexAccountDataProp.ADDRESS]?: string;
    [DexAccountDataProp.BALANCES]?: Map<string, string>;
    [DexAccountDataProp.NONCE]?: string;
    [DexAccountDataProp.WALLETS]?: Map<string, Address>;
}

export const DEFAULT_DEX_ACCOUNT_DATA: DexAccountData = {
    [DexAccountDataProp.ADDRESS]: undefined,
    [DexAccountDataProp.BALANCES]: undefined,
    [DexAccountDataProp.WALLETS]: undefined,
}


export class DexAccountService {

    protected data: DexAccountData = DEFAULT_DEX_ACCOUNT_DATA

    constructor(protected readonly wallet: WalletService) {
        makeAutoObservable(this)

        this.#walletAccountDisposer = reaction(() => this.wallet.address, () => {
            this.data = DEFAULT_DEX_ACCOUNT_DATA
        })
    }

    public async connect(): Promise<void> {
        if (!this.wallet.address) {
            return
        }

        await getDexAccount(this.wallet.address).then(address => {
            runInAction(() => {
                this.data = {
                    ...this.data,
                    [DexAccountDataProp.ADDRESS]: address,
                }
            })
        })
    }

    public async create(): Promise<TransactionId | undefined> {
        if (!this.wallet.address) {
            return undefined
        }

        return Dex.createAccount(new Address(this.wallet.address))
    }

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

    public async syncBalances(): Promise<void> {
        if (!this.wallet.account || !this.address) {
            return
        }

        await Dex.accountBalances(new Address(this.address)).then(balances => {
            runInAction(() => {
                this.data[DexAccountDataProp.BALANCES] = balances
            })
        })
    }

    public async syncWallets(): Promise<void> {
        if (!this.wallet.account || !this.address) {
            return
        }

        await Dex.accountWallets(new Address(this.address)).then(wallets => {
            runInAction(() => {
                this.data[DexAccountDataProp.WALLETS] = wallets
            })
        })
    }

    public async syncNonce(): Promise<void> {
        if (this.address) {
            await Dex.accountNonce(new Address(this.address)).then(nonce => {
                runInAction(() => {
                    this.data[DexAccountDataProp.NONCE] = (parseInt(nonce, 10) + 1).toString()
                })
            })
        }
    }

    public async withdrawToken(root: string, amount: string): Promise<void> {
        if (!this.address || !this.wallet.address || !root || !amount) {
            return
        }

        await Dex.withdrawAccountTokens(
            new Address(this.address),
            new Address(root),
            new Address(this.wallet.address),
            amount,
        )
    }

    protected runBalancesUpdater(): void {
        this.stopBalancesUpdater()

        this.#balancesInterval = setInterval(async () => {
            await this.syncBalances()
        }, 5000)
    }

    public stopBalancesUpdater(): void {
        if (this.#balancesInterval !== undefined) {
            clearInterval(this.#balancesInterval)
            this.#balancesInterval = undefined
        }
    }

    public getAccountWallet(root: string | undefined): Address | undefined {
        if (!root) {
            return undefined
        }
        return this.wallets?.get(root)
    }

    public get address(): DexAccountData[DexAccountDataProp.ADDRESS] {
        return this.data[DexAccountDataProp.ADDRESS]
    }

    public get balances(): DexAccountData[DexAccountDataProp.BALANCES] {
        return this.data[DexAccountDataProp.BALANCES]
    }

    public get nonce(): DexAccountData[DexAccountDataProp.NONCE] {
        return this.data[DexAccountDataProp.NONCE]
    }

    public get wallets(): DexAccountData[DexAccountDataProp.WALLETS] {
        return this.data[DexAccountDataProp.WALLETS]
    }

    #walletAccountDisposer: IReactionDisposer | undefined

    #balancesInterval: ReturnType<typeof setInterval> | undefined

}


const DexAccount = new DexAccountService(useWallet())

export function useDexAccount(): DexAccountService {
    return DexAccount
}
