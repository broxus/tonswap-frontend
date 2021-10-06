import BigNumber from 'bignumber.js'
import { Address } from 'ton-inpage-provider'
import { makeAutoObservable, runInAction } from 'mobx'

import { FarmingDataStore, useFarmingDataStore } from '@/modules/Farming/stores/FarmingDataStore'
import { executeAction } from '@/modules/Farming/utils'
import { useWallet, WalletService } from '@/stores/WalletService'
import { Farm } from '@/misc'
import { error } from '@/utils'

type State = {
    loading: boolean;
    amount?: string;
}

const defaultState: State = Object.freeze({
    loading: false,
})

export class FarmingWithdrawStore {

    protected state: State = defaultState

    constructor(
        protected wallet: WalletService,
        protected farmingDataStore: FarmingDataStore,
    ) {
        makeAutoObservable(this, {}, {
            autoBind: true,
        })
    }

    public dispose(): void {
        this.state = defaultState
    }

    // FIXME: Wait while change walletAmount
    public async withdraw(): Promise<void> {
        if (this.state.loading === true) {
            throw new Error('Withdraw action is currently loading')
        }

        runInAction(() => {
            this.state.loading = true
        })

        try {
            await this.farmingDataStore.syncData()

            const { lpTokenDecimals, poolAddress, userLpWalletAddress } = this.farmingDataStore
            const { amount } = this.state
            const ownerAddress = this.wallet.address

            if (!amount || !this.amountIsValid) {
                throw new Error('Withdraw amount is invalid')
            }
            if (!ownerAddress) {
                throw new Error('Wallet must be connected')
            }
            if (!poolAddress) {
                throw new Error('Pool address must be exists in farming data store')
            }
            if (!userLpWalletAddress) {
                throw new Error('User lp wallet address must be exists in farming data store')
            }
            if (!lpTokenDecimals) {
                throw new Error('Root token decimals must be exists in farming data store')
            }

            const amountBN = new BigNumber(amount)
                .shiftedBy(lpTokenDecimals)
                .decimalPlaces(0)

            await executeAction(
                poolAddress,
                ownerAddress,
                userLpWalletAddress,
                () => Farm.poolWithdraw(
                    amountBN.toFixed(),
                    new Address(poolAddress),
                    new Address(ownerAddress),
                ),
                'Withdraw',
            )

            await this.farmingDataStore.syncData()

            runInAction(() => {
                this.state.amount = undefined
            })
        }
        catch (e) {
            error(e)
        }
        finally {
            runInAction(() => {
                this.state.loading = false
            })
        }
    }

    public get loading(): boolean {
        return this.state.loading
    }

    public get amount(): string | undefined {
        return this.state.amount
    }

    public setAmount(value: string | undefined): void {
        this.state.amount = value
    }

    public get amountIsValid(): boolean {
        const { lpTokenDecimals, userLpFarmingAmount } = this.farmingDataStore

        if (!userLpFarmingAmount || !lpTokenDecimals || !this.state.amount) {
            return false
        }

        const amountBN = new BigNumber(this.state.amount)
            .shiftedBy(lpTokenDecimals)
            .decimalPlaces(0)

        return !amountBN.isNaN()
            && amountBN.isLessThanOrEqualTo(userLpFarmingAmount)
            && amountBN.isGreaterThan(0)
    }

}

const farmingWithdrawStore = new FarmingWithdrawStore(
    useWallet(),
    useFarmingDataStore(),
)

export function useFarmingWithdrawStore(): FarmingWithdrawStore {
    return farmingWithdrawStore
}
