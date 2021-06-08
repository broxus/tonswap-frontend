import {
    makeAutoObservable,
    reaction,
    runInAction,
} from 'mobx'
import ton, {
    ContractState,
    FullContractState,
    Permissions,
    Subscription,
    Transaction,
    hasTonProvider,
} from 'ton-inpage-provider'

import { connectToWallet } from '@/misc/helpers'
import { error, log } from '@/utils'


export type Account = Permissions['accountInteraction']

export type WalletState = {
    hasProvider: boolean;
    isConnecting: boolean;
    isInitialized: boolean;
}

export type WalletData = {
    account?: Account;
    balance: string;
    contract?: ContractState | FullContractState;
    transaction?: Transaction;
}


export class WalletService {

    /**
     * Internal current state of the wallet data
     * @protected
     */
    protected data: WalletData = {
        account: undefined,
        balance: '0',
        contract: undefined,
        transaction: undefined,
    }

    /**
     * Internal current state of the wallet connection
     * @protected
     */
    protected state: WalletState = {
        hasProvider: false,
        isConnecting: false,
        isInitialized: false,
    }

    /**
     * Internal instance of the Ton Subscription for Contract updates
     * @private
     */
    #contractSubscriber: Subscription<'contractStateChanged'> | undefined

    /**
     * Internal instance of the Ton Subscription for Transaction updates
     * @private
     */
    #transactionsSubscriber: Subscription<'transactionsFound'> | undefined

    constructor() {
        this.#contractSubscriber = undefined
        this.#transactionsSubscriber = undefined

        makeAutoObservable(this)

        reaction(
            () => this.data.contract,
            contract => {
                this.data.balance = contract?.balance ?? '0'
            },
        )

        reaction(
            () => this.data.account,
            (account, prevAccount) => {
                if (prevAccount?.address?.toString() === account?.address?.toString()) {
                    this.state.isConnecting = false
                    return
                }

                this.handleAccountChange(account).then(() => {
                    runInAction(() => {
                        this.state.isConnecting = false
                    })
                })
            },
        )

        this.init().catch(err => {
            error('Wallet init error', err)
            runInAction(() => {
                this.state.isConnecting = false
            })
        })
    }

    /**
     * Wallet initializing
     * @private
     * @returns Promise<void>
     */
    private async init() {
        const hasProvider = await hasTonProvider()

        if (!hasProvider) {
            runInAction(() => {
                this.state.hasProvider = false
            })
            return
        }

        await ton.ensureInitialized()

        const permissionsSubscriber = await ton.subscribe('permissionsChanged')
        permissionsSubscriber.on('data', event => {
            runInAction(() => {
                this.data.account = event.permissions.accountInteraction
            })
        })

        const currentProviderState = await ton.getProviderState()
        if (currentProviderState.permissions.accountInteraction == null) {
            runInAction(() => {
                this.state.isInitialized = true
                this.state.hasProvider = true
            })
            return
        }

        runInAction(() => {
            this.state.isConnecting = true
        })

        await connectToWallet()

        runInAction(() => {
            this.state.isInitialized = true
            this.state.hasProvider = true
        })
    }

    /**
     * Manually connect to the wallet
     */
    public async connect(): Promise<void> {
        if (this.isConnecting) {
            return
        }

        const hasProvider = await hasTonProvider()

        runInAction(() => {
            this.state.hasProvider = hasProvider
            this.state.isConnecting = true
        })

        connectToWallet().catch(err => {
            error('Wallet connect error', err)
            runInAction(() => {
                this.state.isConnecting = false
            })
        })
    }

    /**
     * Manually disconnect from wallet
     */
    public disconnect(): void {
        if (this.isConnecting) {
            return
        }

        this.state.isConnecting = true

        ton.disconnect().then(() => {
            this.reset()
        }).catch(err => {
            error('Wallet disconnect error', err)
            runInAction(() => {
                this.state.isConnecting = false
            })
        })
    }

    /**
     * Cancel connecting state
     */
    public cancelConnecting(): void {
        this.state.isConnecting = false
    }

    /**
     * Full wallet data reset
     * @private
     */
    private reset() {
        this.data = {
            account: undefined,
            contract: undefined,
            balance: '0',
            transaction: undefined,
        }
        this.state.isConnecting = false
    }

    /**
     * Internal callback to subscribe for contract and transactions updates.
     *
     * Run it when account was changed or disconnected.
     * @param {Account} account
     * @private
     */
    private async handleAccountChange(account?: Account): Promise<void> {
        if (this.#contractSubscriber) {
            if (account) {
                await this.#contractSubscriber.unsubscribe()
            }
            this.#contractSubscriber = undefined
        }

        if (this.#transactionsSubscriber) {
            if (account) {
                await this.#transactionsSubscriber.unsubscribe()
            }
            this.#transactionsSubscriber = undefined
        }

        if (!account) {
            return
        }

        const { state: contract } = await ton.getFullContractState({
            address: account.address,
        })

        runInAction(() => {
            this.data.contract = contract
        })

        this.#contractSubscriber = await ton.subscribe(
            'contractStateChanged',
            { address: account.address },
        )
        this.#contractSubscriber.on('data', event => {
            log(
                '%cTON Provider%c The wallet\'s `contractStateChanged` event was captured',
                'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
                'color: #c5e4f3',
                event,
            )
            runInAction(() => {
                this.data.contract = event.state
            })
        })
        this.#transactionsSubscriber = await ton.subscribe(
            'transactionsFound',
            { address: account.address },
        )
        this.#transactionsSubscriber.on('data', event => {
            log(
                '%cTON Provider%c The wallet\'s `transactionsFound` event was captured',
                'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
                'color: #c5e4f3',
                event,
            )
            event.transactions.forEach(transaction => {
                runInAction(() => {
                    this.data.transaction = transaction
                })
            })
        })
    }

    /**
     * Return computed account
     */
    public get account(): WalletData['account'] {
        return this.data.account
    }

    /**
     * Return computed wallet address value
     */
    public get address(): string | undefined {
        return this.data.account?.address.toString()
    }

    /**
     * Return computed wallet balance value
     */
    public get balance(): WalletData['balance'] {
        return this.data.balance
    }

    /**
     * Return computed last successful transaction data
     */
    public get transaction(): WalletData['transaction'] {
        return this.data.transaction
    }

    /**
     * Return `true` if provider is available.
     * That means extension is installed in activated, else `false`
     */
    public get hasProvider(): WalletState['hasProvider'] {
        return this.state.hasProvider
    }

    /**
     * Return computed connecting state value
     */
    public get isConnecting(): WalletState['isConnecting'] {
        return this.state.isConnecting
    }

    /**
     * Return computed initialized state value
     */
    public get isInitialized(): WalletState['isInitialized'] {
        return this.state.isInitialized
    }

}


const WalletServiceStore = new WalletService()

export function useWallet(): WalletService {
    return WalletServiceStore
}
