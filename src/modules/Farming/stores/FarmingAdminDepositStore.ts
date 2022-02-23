import BigNumber from 'bignumber.js'
import { Address } from 'everscale-inpage-provider'
import { makeAutoObservable, runInAction, toJS } from 'mobx'

import { useRpcClient } from '@/hooks/useRpcClient'
import { TokenWallet } from '@/misc'
import { FarmingDataStore, useFarmingDataStore } from '@/modules/Farming/stores/FarmingDataStore'
import { useWallet, WalletService } from '@/stores/WalletService'
import { TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import { error } from '@/utils'

type State = {
    amounts: string[];
    loadings: boolean[];
}

const defaultState: State = Object.freeze({
    amounts: [],
    loadings: [],
})


const rpc = useRpcClient()


export class FarmingAdminDepositStore {

    protected state: State = defaultState

    constructor(
        protected wallet: WalletService,
        protected farmingDataStore: FarmingDataStore,
        protected tokensCache: TokensCacheService,
    ) {
        makeAutoObservable(this, {}, {
            autoBind: true,
        })
    }

    public dispose(): void {
        this.state = defaultState
    }

    public async deposit(index: number): Promise<void> {
        const { amounts } = this.state

        try {
            if (this.state.loadings[index]) {
                throw new Error('Deposit action is currently loading')
            }

            this.setLoading(index, true)

            await this.farmingDataStore.syncData()

            if (!this.wallet.address) {
                throw new Error('Wallet must be connected')
            }

            if (!this.farmingDataStore.rewardTokensAddress) {
                throw new Error('Reward tokens address must be exist in farming data store')
            }

            if (!this.farmingDataStore.poolAddress) {
                throw new Error('Pool address must be exist in farming data store')
            }

            if (!this.farmingDataStore.rewardTokensBalance) {
                throw new Error('Reward tokens balance must be exist in farming data store')
            }

            const token = this.tokensCache.get(this.farmingDataStore.rewardTokensAddress[index])

            if (!token) {
                throw new Error('Token must be exist in token cache store')
            }

            const poolWalletAddress = await TokenWallet.walletAddress({
                root: new Address(token.root),
                owner: new Address(this.farmingDataStore.poolAddress),
            })
            const poolWalletState = (await rpc.getFullContractState({
                address: poolWalletAddress,
            })).state

            if (!poolWalletState || !poolWalletState.isDeployed) {
                throw new Error('Pool wallet is not deployed')
            }

            if (!this.amountsIsValid[index]) {
                throw new Error('Deposit amount is invalid')
            }

            const amountBN = new BigNumber(amounts[index])
                .shiftedBy(token.decimals)
                .decimalPlaces(0)

            await TokenWallet.send({
                address: new Address(token.root),
                owner: new Address(this.wallet.address),
                recipient: poolWalletAddress,
                tokens: amountBN.toFixed(),
                withDerive: true,
            })

            let success = false
            const balance = this.farmingDataStore.rewardTokensBalance[index]
            while (!success) {
                const newBalance = await TokenWallet.balance({
                    wallet: poolWalletAddress,
                })
                success = !(new BigNumber(newBalance).eq(balance))
            }

            this.farmingDataStore.syncData()

            runInAction(() => {
                amounts[index] = ''
            })
        }
        catch (e) {
            error(e)
        }
        finally {
            this.setLoading(index, false)
        }
    }

    protected setLoading(index: number, loading: boolean): void {
        const loadings = [...this.state.loadings]
        loadings[index] = loading
        this.state.loadings = loadings
    }

    public setAmount(index: number, value: string): void {
        const amounts = [...this.state.amounts]
        amounts[index] = value
        this.state.amounts = amounts
    }

    public get amounts(): string[] {
        return toJS(this.state.amounts)
    }

    public get loadings(): boolean[] {
        return toJS(this.state.loadings)
    }

    public get amountsIsValid(): boolean[] {
        return (this.farmingDataStore.rewardTokensAddress || [])
            .map((root, index) => {
                const token = this.tokensCache.get(root)
                const amount = toJS(this.state.amounts)[index]
                const { userRewardTokensBalance } = this.farmingDataStore

                if (!token || !amount || !userRewardTokensBalance) {
                    return false
                }

                const amountBN = new BigNumber(amount)
                    .shiftedBy(token.decimals)
                    .decimalPlaces(0)

                return amountBN.isLessThanOrEqualTo(userRewardTokensBalance[index])
                    && amountBN.isGreaterThan(0)
            })
    }

    public get enoughTokensBalance(): boolean {
        const { rewardTokensBalanceCumulative } = this.farmingDataStore

        if (!rewardTokensBalanceCumulative) {
            return false
        }

        return rewardTokensBalanceCumulative
            .some(amount => new BigNumber(amount).gt(0))
    }

}

const farmingAdminDepositStore = new FarmingAdminDepositStore(
    useWallet(),
    useFarmingDataStore(),
    useTokensCache(),
)

export function useFarmingAdminDepositStore(): FarmingAdminDepositStore {
    return farmingAdminDepositStore
}
