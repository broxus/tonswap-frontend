import BigNumber from 'bignumber.js'
import {
    Address,
    AssetType,
    Contract,
    ContractState,
    FullContractState,
    hasEverscaleProvider,
    Permissions,
    Subscription,
} from 'everscale-inpage-provider'
import {
    action,
    computed,
    makeObservable,
    reaction,
} from 'mobx'

import { useRpcClient } from '@/hooks/useRpcClient'
import {
    connectToWallet,
    DexAbi,
    DexConstants,
    Token,
} from '@/misc'
import { BaseStore } from '@/stores/BaseStore'
import { debug, error, log } from '@/utils'


export type Account = Permissions['accountInteraction']

export type WalletData = {
    account?: Account;
    balance: string;
    contract?: ContractState | FullContractState;
    version?: string;
}

export type WalletState = {
    hasProvider: boolean;
    isConnecting: boolean;
    isInitialized: boolean;
    isInitializing: boolean;
    isUpdatingContract: boolean;
}

export type WalletServiceCtorOptions = {
    /** Semver dot-notation string */
    minWalletVersion?: string;
}

export type WalletNativeCoin = Pick<Token, 'balance' | 'decimals' | 'icon' | 'name' | 'symbol'>


const DEFAULT_WALLET_DATA: WalletData = {
    account: undefined,
    balance: '0',
    contract: undefined,
}

const DEFAULT_WALLET_STATE: WalletState = {
    hasProvider: false,
    isConnecting: false,
    isInitialized: false,
    isInitializing: false,
    isUpdatingContract: false,
}

const rpc = useRpcClient()


export class WalletService extends BaseStore<WalletData, WalletState> {

    constructor(
        protected readonly nativeCoin?: WalletNativeCoin,
        protected readonly options?: WalletServiceCtorOptions,
    ) {
        super()

        this.#contractSubscriber = undefined

        this.setData(DEFAULT_WALLET_DATA)
        this.setState({
            ...DEFAULT_WALLET_STATE,
            isInitializing: true,
        })

        makeObservable(this, {
            connect: action.bound,
            disconnect: action.bound,
            address: computed,
            balance: computed,
            balanceNumber: computed,
            hasProvider: computed,
            isConnected: computed,
            isConnecting: computed,
            isInitialized: computed,
            isInitializing: computed,
            isOutdated: computed,
            isReady: computed,
            isUpdatingContract: computed,
            account: computed,
            coin: computed,
            contract: computed,
            walletContractCallbacks: computed,
        })

        reaction(
            () => this.contract?.balance,
            balance => {
                this.setData('balance', balance || '0')
            },
            { fireImmediately: true },
        )

        reaction(
            () => this.account,
            (account, prevAccount) => {
                if (prevAccount?.address?.toString() === account?.address?.toString()) {
                    this.setState('isConnecting', false)
                    return
                }

                this.onAccountChange(account).then(() => {
                    this.setState('isConnecting', false)
                })
            },
            { fireImmediately: true },
        )

        this.init().catch(reason => {
            error('Wallet init error', reason)
            this.setState('isConnecting', false)
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

        this.setState('isConnecting', true)

        try {
            const hasProvider = await hasEverscaleProvider()
            this.setState('hasProvider', hasProvider)
        }
        catch (e) {
            this.setState('hasProvider', false)
            return
        }

        if (!this.hasProvider) {
            return
        }

        try {
            await connectToWallet()
        }
        catch (e) {
            error('Wallet connect error', e)
        }
        finally {
            this.setState('isConnecting', false)
        }
    }

    /**
     * Manually disconnect from the wallet
     * @returns {Promise<void>}
     */
    public async disconnect(): Promise<void> {
        if (this.isConnecting) {
            return
        }

        this.setState('isConnecting', true)

        try {
            await rpc.disconnect()
            this.reset()
        }
        catch (e) {
            error('Wallet disconnect error', e)
        }
        finally {
            this.setState('isConnecting', false)
        }
    }

    /**
     * Add custom token asset to the EVER Wallet
     * @param {string} root
     * @param {AssetType} [type]
     */
    public async addAsset(root: string, type: AssetType = 'tip3_token'): Promise<{ newAsset: boolean } | undefined> {
        if (this.account?.address === undefined) {
            return undefined
        }

        return rpc.addAsset({
            account: this.account.address,
            params: {
                rootContract: new Address(root),
            },
            type,
        })
    }

    /**
     * Returns computed wallet address value
     * @returns {string | undefined}
     */
    public get address(): string | undefined {
        return this.account?.address.toString()
    }

    /**
     * Returns computed wallet balance value
     * @returns {string | undefined}
     */
    public get balance(): WalletData['balance'] {
        return this.data.balance
    }

    /**
     * Returns computed BigNumber instance of the wallet balance value
     * @returns {BigNumber}
     */
    public get balanceNumber(): BigNumber {
        return new BigNumber(this.balance || 0).shiftedBy(-this.coin.decimals)
    }

    /**
     * Returns `true` if provider is available.
     * That means extension is installed and activated, else `false`
     * @returns {boolean}
     */
    public get hasProvider(): WalletState['hasProvider'] {
        return this.state.hasProvider
    }

    /**
     * Returns `true` if wallet is connected
     * @returns {boolean}
     */
    public get isConnected(): boolean {
        return this.address !== undefined
    }

    /**
     * Returns `true` if wallet is connecting
     * @returns {boolean}
     */
    public get isConnecting(): WalletState['isConnecting'] {
        return this.state.isConnecting
    }

    /**
     * Returns `true` if wallet is initialized
     * @returns {boolean}
     */
    public get isInitialized(): WalletState['isInitialized'] {
        return this.state.isInitialized
    }

    /**
     * Returns `true` if wallet is initializing
     * @returns {boolean}
     */
    public get isInitializing(): WalletState['isInitializing'] {
        return this.state.isInitializing
    }

    /**
     * Returns `true` if installed wallet has outdated version
     */
    public get isOutdated(): boolean {
        if (this.data.version === undefined || this.options?.minWalletVersion === undefined) {
            return false
        }

        const [
            currentMajorVersion = '0',
            currentMinorVersion = '0',
            currentPatchVersion = '0',
        ] = this.data.version.split('.')
        const [
            minMajorVersion,
            minMinorVersion,
            minPatchVersion,
        ] = this.options.minWalletVersion.split('.')
        return (
            currentMajorVersion < minMajorVersion
            || (currentMajorVersion <= minMajorVersion && currentMinorVersion < minMinorVersion)
            || (
                currentMajorVersion <= minMajorVersion
                && currentMinorVersion <= minMinorVersion
                && currentPatchVersion < minPatchVersion
            )
        )
    }

    /**
     * Returns `true` if connection to RPC is initialized and connected
     * @returns {boolean}
     */
    public get isReady(): boolean {
        return (
            !this.isInitializing
            && !this.isConnecting
            && this.isInitialized
            && this.isConnected
        )
    }

    /**
     * Returns `true` if wallet contract is updating
     * @returns {boolean}
     */
    public get isUpdatingContract(): WalletState['isUpdatingContract'] {
        return this.state.isUpdatingContract
    }

    /**
     * Returns computed account
     * @returns {WalletData['account']}
     */
    public get account(): WalletData['account'] {
        return this.data.account
    }

    /**
     * Returns base native wallet coin
     * @returns {WalletNativeCoin}
     */
    public get coin(): WalletNativeCoin {
        return {
            balance: this.balance,
            decimals: this.nativeCoin?.decimals ?? DexConstants.CoinDecimals,
            icon: this.nativeCoin?.icon || DexConstants.CoinLogoURI,
            name: this.nativeCoin?.name || DexConstants.CoinSymbol,
            symbol: this.nativeCoin?.symbol || DexConstants.CoinSymbol,
        }
    }

    /**
     * Returns computed wallet contract state
     * @returns {WalletData['contract']}
     */
    public get contract(): WalletData['contract'] {
        return this.data.contract
    }

    /**
     * Returns computed DEX Callbacks ABI Contract for current by current wallet address.
     * @returns {Contract<typeof DexAbi.Callbacks> | undefined}
     */
    public get walletContractCallbacks(): Contract<typeof DexAbi.Callbacks> | undefined {
        return this.account?.address !== undefined
            ? new rpc.Contract(DexAbi.Callbacks, this.account.address)
            : undefined
    }

    /**
     * Wallet initializing. It runs
     * @returns {Promise<void>}
     * @protected
     */
    protected async init(): Promise<void> {
        this.setState('isInitializing', true)

        let hasProvider = false

        try {
            hasProvider = await hasEverscaleProvider()
        }
        catch (e) {}

        if (!hasProvider) {
            this.setState({
                hasProvider: false,
                isInitializing: false,
            })
            return
        }

        this.setState('hasProvider', hasProvider)

        try {
            await rpc.ensureInitialized()
        }
        catch (e) {
            return
        }

        this.setState('isConnecting', true)

        const permissionsSubscriber = await rpc.subscribe('permissionsChanged')
        permissionsSubscriber.on('data', event => {
            this.setData('account', event.permissions.accountInteraction)
        })

        const currentProviderState = await rpc.getProviderState()

        if (currentProviderState.permissions.accountInteraction === undefined) {
            this.setState({
                isConnecting: false,
                isInitialized: true,
                isInitializing: false,
            })
            return
        }

        this.setData('version', currentProviderState.version)

        await connectToWallet()

        this.setState({
            isConnecting: false,
            isInitialized: true,
            isInitializing: false,
        })
    }

    /**
     * Internal callback to subscribe for contract and transactions updates.
     *
     * Run it when account was changed or disconnected.
     * @param {Account} [account]
     * @returns {Promise<void>}
     * @protected
     */
    protected async onAccountChange(account?: Account): Promise<void> {
        if (this.#contractSubscriber !== undefined) {
            if (account !== undefined) {
                try {
                    await this.#contractSubscriber.unsubscribe()
                }
                catch (e) {
                    error('Wallet contract unsubscribe error', e)
                }
            }
            this.#contractSubscriber = undefined
        }

        if (account === undefined) {
            return
        }

        this.setState('isUpdatingContract', true)

        try {
            const { state } = await rpc.getFullContractState({
                address: account.address,
            })

            this.setData('contract', state)
            this.setState('isUpdatingContract', false)
        }
        catch (e) {
            error('Get account full contract state error', e)
        }
        finally {
            this.setState('isUpdatingContract', false)
        }

        try {
            this.#contractSubscriber = await rpc.subscribe(
                'contractStateChanged',
                { address: account.address },
            )

            this.#contractSubscriber.on('data', event => {
                debug(
                    '%RPC%c The wallet\'s `contractStateChanged` event was captured',
                    'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
                    'color: #c5e4f3',
                    event,
                )

                this.setData('contract', event.state)
            })
        }
        catch (e) {
            error('Contract subscribe error', e)
            this.#contractSubscriber = undefined
        }
    }

    /**
     * Reset wallet data to defaults
     * @protected
     */
    protected reset(): void {
        this.setData(DEFAULT_WALLET_DATA)
    }

    /**
     * Internal instance of the Ton Subscription for Contract updates
     * @type {Subscription<'contractStateChanged'> | undefined}
     * @protected
     */
    #contractSubscriber: Subscription<'contractStateChanged'> | undefined

}


let wallet: WalletService

export function useWallet(): WalletService {
    if (wallet === undefined) {
        log(
            '%cCreated a new one WalletService instance as global service to interact with the EVER Wallet browser extension',
            'color: #bae701',
        )
        wallet = new WalletService({
            decimals: DexConstants.CoinDecimals,
            icon: DexConstants.CoinLogoURI,
            name: DexConstants.CoinSymbol,
            symbol: DexConstants.CoinSymbol,
        }, {
            minWalletVersion: DexConstants.MinWalletVersion,
        })
    }
    return wallet
}

