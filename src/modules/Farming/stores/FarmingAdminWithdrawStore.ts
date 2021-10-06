import { Address } from 'ton-inpage-provider'
import { makeAutoObservable, runInAction } from 'mobx'

import { FarmingDataStore, useFarmingDataStore } from '@/modules/Farming/stores/FarmingDataStore'
import { TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import { useWallet, WalletService } from '@/stores/WalletService'
import { error } from '@/utils'
import { Farm } from '@/misc'
import { SECONDS_IN_DAY } from '@/constants'

type State = {
    loading: boolean;
}

const defaultState: State = Object.freeze({
    loading: false,
})

export class FarmingAdminWithdrawStore {

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

    public async submit(): Promise<void> {
        if (this.state.loading) {
            throw new Error('Admin withdraw action is currently loading')
        }

        runInAction(() => {
            this.state.loading = true
        })

        try {
            await this.farmingDataStore.syncData()

            if (!this.farmingDataStore.poolAddress) {
                throw new Error('Pool address must be exists in farming store')
            }
            if (!this.wallet.address) {
                throw new Error('Wallet must be connected')
            }

            await Farm.poolAdminWithdrawUnclaimedAll(
                new Address(this.farmingDataStore.poolAddress),
                new Address(this.wallet.address),
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

    public get isEnabled(): boolean {
        const { endTime } = this.farmingDataStore

        if (endTime === 0) {
            return false
        }

        const currentTime = new Date().getTime()
        const lockTime = SECONDS_IN_DAY * 30 * 1000

        if (endTime + lockTime < currentTime) {
            return true
        }

        return false
    }

}

const farmingAdminWithdrawStore = new FarmingAdminWithdrawStore(
    useWallet(),
    useFarmingDataStore(),
    useTokensCache(),
)

export function useFarmingAdminWithdrawStore(): FarmingAdminWithdrawStore {
    return farmingAdminWithdrawStore
}
