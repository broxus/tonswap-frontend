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
import { error, debug } from '@/utils'


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


const DEFAULT_WALLET_DATA: WalletData = {
    account: undefined,
    balance: '0',
    contract: undefined,
    transaction: undefined,
}


export class WalletService {

    /**
     * Current data of the wallet
     * @type {WalletData}
     * @protected
     */
    protected data: WalletData = DEFAULT_WALLET_DATA

    /**
     * Current state of the wallet connection
     * @type {WalletState}
     * @protected
     */
    protected state: WalletState = {
        hasProvider: false,
        isConnecting: false,
        isInitialized: false,
    }

    constructor() {
        this.#contractSubscriber = undefined

        makeAutoObservable(this)

        reaction(
            () => this.data.contract,
            contract => {
                this.data.balance = contract?.balance || '0'
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
     * Wallet initializing. It runs
     * @returns {Promise<void>}
     * @private
     */
    private async init(): Promise<void> {
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
        if (!currentProviderState.permissions.accountInteraction) {
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
     * @returns {Promise<void>}
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

        await connectToWallet().catch(err => {
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
        this.data = DEFAULT_WALLET_DATA
        this.state.isConnecting = false
    }

    /**
     * Internal callback to subscribe for contract and transactions updates.
     *
     * Run it when account was changed or disconnected.
     * @param {Account} account
     * @returns {Promise<void>}
     * @private
     */
    private async handleAccountChange(account?: Account): Promise<void> {
        if (this.#contractSubscriber) {
            if (account) {
                try {
                    await this.#contractSubscriber.unsubscribe()
                }
                catch (e) {
                    error(e)
                }
            }
            this.#contractSubscriber = undefined
        }

        if (!account) {
            return
        }

        await ton.getFullContractState({
            address: account.address,
        }).then(({ state }) => {
            runInAction(() => {
                this.data.contract = state
            })
        })

        this.#contractSubscriber = await ton.subscribe(
            'contractStateChanged',
            { address: account.address },
        )
        this.#contractSubscriber.on('data', event => {
            debug(
                '%cTON Provider%c The wallet\'s `contractStateChanged` event was captured',
                'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
                'color: #c5e4f3',
                event,
            )
            runInAction(() => {
                this.data.contract = event.state
            })
        })
    }

    /**
     * Return computed account
     * @returns {WalletData["account"]}
     */
    public get account(): WalletData['account'] {
        return this.data.account
    }

    /**
     * Return computed wallet address value
     * @returns {string | undefined}
     */
    public get address(): string | undefined {
        return this.data.account?.address.toString()
    }

    /**
     * Return computed wallet balance value
     * @returns {WalletData['balance']}
     */
    public get balance(): WalletData['balance'] {
        return this.data.balance
    }

    /**
     * Returns computed wallet contract state
     * @returns {WalletData['contract']}
     */
    public get contract(): WalletData['contract'] {
        return this.data.contract
    }

    /**
     * Return computed last successful transaction data
     * @returns {WalletData['transaction']}
     */
    public get transaction(): WalletData['transaction'] {
        return this.data.transaction
    }

    /**
     * Return `true` if provider is available.
     * That means extension is installed in activated, else `false`
     * @returns {WalletState['hasProvider']}
     */
    public get hasProvider(): WalletState['hasProvider'] {
        return this.state.hasProvider
    }

    /**
     * Return computed connecting state value
     * @returns {WalletState['isConnecting']}
     */
    public get isConnecting(): WalletState['isConnecting'] {
        return this.state.isConnecting
    }

    /**
     * Return computed initialized state value
     * @returns {WalletState['isInitialized']}
     */
    public get isInitialized(): WalletState['isInitialized'] {
        return this.state.isInitialized
    }

    /**
     * Internal instance of the Ton Subscription for Contract updates
     * @type {Subscription<'contractStateChanged'> | undefined}
     * @private
     */
    #contractSubscriber: Subscription<'contractStateChanged'> | undefined

}


const WalletServiceStore = new WalletService()

export function useWallet(): WalletService {
    return WalletServiceStore
}
