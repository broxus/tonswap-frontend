import {
    action, IReactionDisposer, makeAutoObservable, reaction,
} from 'mobx'
import ton, { Address, Contract } from 'ton-inpage-provider'
import BigNumber from 'bignumber.js'

import { DEFAULT_MANAGE_TOKEN_STORE_DATA, DEFAULT_MANAGE_TOKEN_STORE_STATE } from '@/modules/Builder/constants'
import { ManageTokenStoreData, ManageTokenStoreState, Token } from '@/modules/Builder/types'
import { useWallet, WalletService } from '@/stores/WalletService'
import { TokenAbi, TokenWallet } from '@/misc'
import { error } from '@/utils'

export class ManageTokenStore {

    protected data: ManageTokenStoreData = DEFAULT_MANAGE_TOKEN_STORE_DATA

    protected state: ManageTokenStoreState = DEFAULT_MANAGE_TOKEN_STORE_STATE

    constructor(protected readonly wallet: WalletService) {
        makeAutoObservable<ManageTokenStore, 'handleWalletAddressChange'>(this, {
            handleWalletAddressChange: action.bound,
        })
    }

    public changeData<K extends keyof ManageTokenStoreData>(key: K, value: ManageTokenStoreData[K]): void {
        this.data[key] = value
    }

    public changeState<K extends keyof ManageTokenStoreState>(key: K, value: ManageTokenStoreState[K]): void {
        this.state[key] = value
    }

    public init(): void {
        this.#walletAccountDisposer = reaction(() => this.wallet.address, this.handleWalletAddressChange)

        if (this.wallet.address !== null) {
            this.handleWalletAddressChange()
        }
    }

    protected async handleWalletAddressChange(walletAddress?: string, prevWalletAddress?: string): Promise<void> {
        if (!walletAddress || walletAddress !== prevWalletAddress) {
            this.reset()
        }

        this.changeState('isLoading', true)

        await this.loadTokenData().then(token => this.changeData('token', token))

        this.changeState('isLoading', false)
    }

    protected async loadTokenData(): Promise<Token | undefined> {
        let state = this.data.tokenCache
        const address = new Address(this.state.tokenRoot)
        const token = new Contract(TokenAbi.Root, address)

        if (!state) {
            state = (await ton.getFullContractState({ address })).state

            if (state) {
                this.changeData('tokenCache', state)
            }
            else {
                return undefined
            }
        }

        if (state.isDeployed) {
            const { value0 } = await token.methods
                .getDetails({ _answer_id: 0 })
                .call({ cachedState: state })

            return {
                ...value0,
                name: atob(value0.name),
                symbol: atob(value0.symbol),
                total_supply: new BigNumber(value0.total_supply).shiftedBy(-value0.decimals).toFixed(),
                root: this.state.tokenRoot,
            } as unknown as Token
        }

        return undefined
    }

    public async mint(): Promise<void> {
        if (
            !this.wallet.address
            || !this.data.token
            || !this.data.targetAddress
            || !this.data.amountToMint
        ) {
            this.changeState('isMinting', false)
            return
        }

        this.changeState('isMinting', true)

        try {
            await new Contract(TokenAbi.Root, new Address(this.state.tokenRoot)).methods.deployWallet({
                tokens: new BigNumber(this.data.amountToMint)
                    .shiftedBy(Number(this.data.token.decimals)).toFixed(),
                deploy_grams: '100000000',
                wallet_public_key_: 0,
                owner_address_: new Address(this.data.targetAddress),
                gas_back_address: new Address(this.data.targetAddress),
            }).send({
                from: new Address(this.wallet.address),
                amount: '600000000',
                bounce: true,
            })

            this.changeState('isMinting', false)
        }
        catch (reason) {
            this.changeState('isMinting', false)
            error('Mint token failure', reason)
        }
    }

    public async transfer(): Promise<void> {
        if (
            !this.wallet.address
            || !this.data.token
            || !this.data.newOwnerAddress
        ) {
            this.changeState('isTransfer', false)
            return
        }

        this.changeState('isTransfer', true)

        try {
            await new Contract(TokenAbi.Root, new Address(this.state.tokenRoot)).methods.transferOwner({
                root_public_key_: 0,
                root_owner_address_: new Address(this.data.newOwnerAddress),
            }).send({
                from: new Address(this.wallet.address),
                amount: '5000000000',
                bounce: true,
            })

            this.changeState('isTransfer', false)
        }
        catch (reason) {
            this.changeState('isTransfer', false)
            error('Transfer token failure', reason)
        }
    }

    public async loadTargetWalletBalance(): Promise<void> {
        if (!this.data.token) {
            return
        }

        const balance = await TokenWallet.balance({
            root: new Address(this.data.token.root),
            owner: new Address(this.data.targetAddress),
        })

        this.changeData('targetWalletBalance', new BigNumber(balance).shiftedBy(-this.data.token.decimals).toFixed())
    }

    public dispose(): void {
        this.#walletAccountDisposer?.()
        this.reset()
    }

    protected reset(): void {
        this.resetData()
    }

    protected resetData(): void {
        this.data = DEFAULT_MANAGE_TOKEN_STORE_DATA
    }

    protected resetState(): void {
        this.state = DEFAULT_MANAGE_TOKEN_STORE_STATE
    }

    public get token(): Token | undefined {
        return this.data.token
    }

    public get isLoading(): boolean {
        return this.state.isLoading
    }

    public get targetAddress(): string {
        return this.data.targetAddress
    }

    public get amountToMint(): string {
        return this.data.amountToMint
    }

    public get newOwnerAddress(): string {
        return this.data.newOwnerAddress
    }

    public get targetWalletBalance(): string {
        return this.data.targetWalletBalance
    }

    public get isMinting(): boolean {
        return this.state.isMinting
    }

    public get isTransfer(): boolean {
        return this.state.isTransfer
    }

    #walletAccountDisposer: IReactionDisposer | undefined

}

const ManageToken = new ManageTokenStore(useWallet())

export function useManageTokenStore(tokenRoot: string): ManageTokenStore {
    ManageToken.changeState('tokenRoot', tokenRoot)

    return ManageToken
}
