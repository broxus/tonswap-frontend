import BigNumber from 'bignumber.js'
import { Address } from 'everscale-inpage-provider'
import {
    makeAutoObservable,
    observable,
    ObservableMap,
    reaction,
    runInAction,
} from 'mobx'

import { useRpcClient } from '@/hooks/useRpcClient'
import { MigrationTokenAbi, TokenWalletV4 } from '@/misc'
import { useWallet, WalletService } from '@/stores/WalletService'
import { error } from '@/utils'


export type OutdatedTokenRaw = {
    logoURI?: string;
    proxy?: string;
    rootV4: string;
    rootV5: string;
    symbol: string;
}

export type OutdatedToken = OutdatedTokenRaw & {
    balance?: string;
    decimals: number;
    name?: string;
    wallet?: string;
}

export type OutdatedTokenManifest = {
    name: string;
    tokens: OutdatedTokenRaw[];
}

export type UpgradeTokensData = {
    tokens: OutdatedToken[];
}

export type UpgradeTokensState = {
    upgradedTokens: ObservableMap<string, boolean>;
    upgradingTokens: ObservableMap<string, boolean>;
}


const rpc = useRpcClient()


export class UpgradeTokens {

    protected data: UpgradeTokensData

    protected state: UpgradeTokensState

    constructor(
        protected readonly tonWallet: WalletService,
    ) {
        this.data = {
            tokens: [],
        }

        this.state = {
            upgradedTokens: new ObservableMap<string, boolean>(),
            upgradingTokens: new ObservableMap<string, boolean>(),
        }

        makeAutoObservable<UpgradeTokens, 'data' | 'state'>(this, {
            data: observable,
            state: observable,
        })

        reaction(() => this.tonWallet.address, async () => {
            await this.checkForUpdates()
        }, { fireImmediately: true })
    }

    public cleanup(): void {
        this.data.tokens = []
    }

    public get tokens(): UpgradeTokensData['tokens'] {
        return this.data.tokens
    }

    public async checkForUpdates(): Promise<void> {
        if (this.tonWallet.account?.address === undefined) {
            return
        }

        const tokens: UpgradeTokensData['tokens'] = []
        const tokensToUpgrade: OutdatedTokenRaw[] = []

        try {
            await fetch('https://raw.githubusercontent.com/broxus/everscale-assets-upgrade/master/main.json', {
                method: 'GET',
            }).then(value => value.json()).then((value: OutdatedTokenManifest) => {
                tokensToUpgrade.push(...value.tokens)
            })
        }
        catch (e) {
            error('Tokens upgrade manifest fetch error', e)
        }

        try {
            // eslint-disable-next-line no-restricted-syntax
            for (const token of tokensToUpgrade) {
                const rootV4Address = new Address(token.rootV4)
                const { state } = await rpc.getFullContractState({ address: rootV4Address })

                if (state === undefined || !state.isDeployed) {
                    continue
                }

                const wallet = await TokenWalletV4.walletAddress({
                    owner: this.tonWallet.account.address,
                    root: rootV4Address,
                })

                const { state: walletState } = await rpc.getFullContractState({
                    address: wallet,
                })

                if (walletState === undefined || !walletState.isDeployed) {
                    continue
                }

                const [balance, decimals, symbol, name] = await Promise.all([
                    TokenWalletV4.balance({ wallet }, walletState),
                    TokenWalletV4.getDecimals(rootV4Address, state),
                    TokenWalletV4.getSymbol(rootV4Address, state),
                    TokenWalletV4.getName(rootV4Address, state),
                ])

                if (new BigNumber(balance ?? 0).isZero() || decimals == null) {
                    continue
                }

                tokens.push({
                    ...token,
                    balance,
                    decimals,
                    name,
                    symbol,
                    wallet: wallet.toString(),
                })
            }

            runInAction(() => {
                this.data.tokens = tokens
            })
        }
        catch (e) {
            error('Upgrades error', e)
        }
    }

    public async upgrade(token: OutdatedToken): Promise<void> {
        if (
            this.isTokenUpgrading(token.rootV4)
            || this.tonWallet.account?.address === undefined
            || token.wallet === undefined
            || token.proxy === undefined
            || token.balance === undefined
        ) {
            return
        }

        this.state.upgradingTokens.set(token.rootV4, true)

        const walletAddress = new Address(token.wallet)
        const walletContract = rpc.createContract(MigrationTokenAbi.WalletV4, walletAddress)

        try {
            await walletContract.methods.burnByOwner({
                callback_address: new Address(token.proxy),
                callback_payload: '',
                grams: 0,
                send_gas_to: this.tonWallet.account.address,
                tokens: token.balance,
            }).send({
                amount: '1000000000',
                bounce: true,
                from: this.tonWallet.account.address,
            })
            this.state.upgradedTokens.set(token.rootV4, true)
            runInAction(() => {
                this.data.tokens = this.tokens.filter(t => t.rootV4 !== token.rootV4)
            })
        }
        catch (e) {
            error('Token upgrade error', e)
        }
        finally {
            this.state.upgradingTokens.set(token.rootV4, false)
        }
    }

    public isTokenUpgraded(root: string): boolean {
        return !!this.state.upgradedTokens.get(root)
    }

    public isTokenUpgrading(root: string): boolean {
        return !!this.state.upgradingTokens.get(root)
    }

    public get hasTokensToUpgrade(): boolean {
        return this.data.tokens.length > 0
    }

}


const store = new UpgradeTokens(useWallet())

export function useUpgradeTokens(): UpgradeTokens {
    return store
}
