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
}

const defaultState: State = Object.freeze({
    loading: false,
})

export class FarmingClaimStore {

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

    public async claim(): Promise<void> {
        if (this.state.loading) {
            throw new Error('Claim action is currently loading')
        }

        runInAction(() => {
            this.state.loading = true
        })

        try {
            await this.farmingDataStore.syncData()

            const ownerAddress = this.wallet.address
            const { poolAddress, userLpWalletAddress } = this.farmingDataStore

            if (!poolAddress) {
                throw new Error('Pool address must be exist in faming data store')
            }
            if (!userLpWalletAddress) {
                throw new Error('User lp wallet address must be exist in faming data store')
            }
            if (!ownerAddress) {
                throw new Error('Wallet must be connected')
            }
            if (!this.claimIsAvailable) {
                throw new Error('Claim is not available')
            }

            await executeAction(
                poolAddress,
                ownerAddress,
                userLpWalletAddress,
                () => Farm.poolClaimReward(
                    new Address(poolAddress),
                    new Address(ownerAddress),
                ),
                'Claim',
            )

            await this.farmingDataStore.syncData()
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

    public get claimIsAvailable(): boolean {
        const { userPendingRewardVested } = this.farmingDataStore

        if (!userPendingRewardVested) {
            return false
        }

        return userPendingRewardVested
            .findIndex(amount => (
                !new BigNumber(amount).isZero()
            )) > -1
    }

}

const farmingClaimStore = new FarmingClaimStore(
    useWallet(),
    useFarmingDataStore(),
)

export function useFarmingClaimStore(): FarmingClaimStore {
    return farmingClaimStore
}
