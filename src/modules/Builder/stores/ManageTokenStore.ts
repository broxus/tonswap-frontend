import {
    action,
    IReactionDisposer,
    makeAutoObservable,
    reaction,
} from 'mobx'
import { Address } from 'everscale-inpage-provider'
import BigNumber from 'bignumber.js'

import { useRpcClient } from '@/hooks/useRpcClient'
import { Token, TokenAbi, TokenWallet } from '@/misc'
import {
    DEFAULT_MANAGE_TOKEN_STORE_DATA,
    DEFAULT_MANAGE_TOKEN_STORE_STATE,
} from '@/modules/Builder/constants'
import { ManageTokenStoreData, ManageTokenStoreState } from '@/modules/Builder/types'
import { useWallet, WalletService } from '@/stores/WalletService'
import { error } from '@/utils'


const rpc = useRpcClient()


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
        this.changeData('targetAddress', this.wallet.address ? this.wallet.address : '')

        try {
            const token = await TokenWallet.getTokenFullDetails(this.state.tokenRoot)
            this.changeData('token', token)
            await this.loadTargetWalletBalance()
        }
        catch (e) {

        }
        finally {
            this.changeState('isLoading', false)
        }
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
            await rpc.createContract(TokenAbi.Root, new Address(this.state.tokenRoot)).methods.mint({
                deployWalletValue: '100000000',
                recipient: new Address(this.data.targetAddress),
                remainingGasTo: new Address(this.wallet.address),
                amount: new BigNumber(this.data.amountToMint)
                    .shiftedBy(+this.data.token!.decimals)
                    .dp(0, BigNumber.ROUND_DOWN)
                    .toFixed(),
                notify: false,
                payload: '',
            }).send({
                from: new Address(this.wallet.address),
                amount: '600000000',
                bounce: true,
            })

            const currentTargetWalletBalance = this.data.targetWalletBalance

            const intervalId = setInterval(async () => {
                await this.loadTargetWalletBalance()

                if (this.data.targetWalletBalance !== currentTargetWalletBalance) {
                    this.changeData('token', {
                        ...this.data.token!,
                        totalSupply: this.data.token?.totalSupply ? new BigNumber(this.data.token.totalSupply)
                            .plus(new BigNumber(this.data.amountToMint)
                            .shiftedBy(+this.data.token!.decimals))
                            .decimalPlaces(+this.data.token!.decimals, BigNumber.ROUND_DOWN)
                            .toFixed() : undefined,
                    })

                    this.changeState('isMinting', false)
                    clearInterval(intervalId)
                }
            }, 5000)
        }
        catch (reason) {
            this.changeState('isMinting', false)
            error('Mint token failure', reason)
        }
    }

    public async burn(): Promise<void> {
        if (
            !this.wallet.address
            || !this.data.token
            || !this.data.targetAddress
            || !this.data.amountToBurn
        ) {
            this.changeState('isBurning', false)
            return
        }

        this.changeState('isBurning', true)

        const result = await rpc.packIntoCell({
            structure: [
                { name: 'data', type: 'bytes' } as const,
            ] as const,
            data: {
                data: btoa(this.data.callbackPayload),
            },
        })

        try {
            await rpc.createContract(TokenAbi.Root, new Address(this.state.tokenRoot)).methods.burnTokens({
                amount: new BigNumber(this.data.amountToBurn)
                    .shiftedBy(Number(this.data.token.decimals)).toFixed(),
                walletOwner: new Address(this.data.targetAddress),
                remainingGasTo: new Address(this.data.targetAddress),
                callbackTo: new Address(this.data.callbackAddress),
                payload: result.boc,
            }).send({
                from: new Address(this.wallet.address),
                amount: '500000000',
                bounce: true,
            })

            const currentTargetWalletBalance = this.data.targetWalletBalance

            const intervalId = setInterval(async () => {
                await this.loadTargetWalletBalance()

                if (this.data.targetWalletBalance !== currentTargetWalletBalance) {
                    this.changeData('token', {
                        ...this.data.token!,
                        totalSupply: this.data.token?.totalSupply ? new BigNumber(this.data.token.totalSupply)
                            .minus(new BigNumber(this.data.amountToBurn ?? 0)
                                .shiftedBy(+this.data.token!.decimals))
                            .decimalPlaces(+this.data.token!.decimals, BigNumber.ROUND_DOWN)
                            .toFixed() : undefined,
                    })

                    this.changeState('isBurning', false)
                    clearInterval(intervalId)
                }
            }, 5000)
        }
        catch (reason) {
            this.changeState('isBurning', false)
            error('Burn token failure', reason)
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
            await rpc.createContract(TokenAbi.Root, new Address(this.state.tokenRoot)).methods.transferOwnership({
                newOwner: new Address(this.data.newOwnerAddress),
                remainingGasTo: new Address(this.wallet.address),
                callbacks: [],
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

        try {
            const balance = await TokenWallet.balance({
                root: new Address(this.data.token.root),
                owner: new Address(this.data.targetAddress),
            })

            this.changeData('targetWalletBalance', new BigNumber(balance).shiftedBy(-this.data.token.decimals).toFixed())
        }
        catch (e) {
            this.changeData('targetWalletBalance', '0')
        }
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

    public get amountToBurn(): string {
        return this.data.amountToBurn
    }

    public get callbackAddress(): string {
        return this.data.callbackAddress
    }

    public get callbackPayload(): string {
        return this.data.callbackPayload
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

    public get isBurning(): boolean {
        return this.state.isBurning
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
