import { DateTime } from 'luxon'
import { Address } from 'ton-inpage-provider'
import { makeAutoObservable, runInAction } from 'mobx'

import { FarmingDataStore, useFarmingDataStore } from '@/modules/Farming/stores/FarmingDataStore'
import { useWallet, WalletService } from '@/stores/WalletService'
import { Farm } from '@/misc'
import { error } from '@/utils'

type State = {
    endTime: string;
    endDate: string;
    loading: boolean;
}

const defaultState: State = Object.freeze({
    endTime: '',
    endDate: '',
    loading: false,
})

export class FarmingEndDateConfigStore {

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

    public async submit(): Promise<void> {
        if (this.state.loading) {
            throw new Error('Submit end date action is currently loading')
        }

        runInAction(() => {
            this.state.loading = true
        })

        try {
            await this.farmingDataStore.syncData()

            const { poolAddress } = this.farmingDataStore

            if (!poolAddress) {
                throw new Error('Pool address must be exists in faming data store')
            }
            if (!this.endDateIsValid) {
                throw new Error('End date is invalid')
            }
            if (!this.wallet.address) {
                throw new Error('Wallet must be connected')
            }

            await Farm.poolAdminSetEndTime(
                new Address(poolAddress),
                new Address(this.wallet.address),
                this.endDateTime.toSeconds().toString(),
            )

            await this.farmingDataStore.syncData()

            runInAction(() => {
                this.state.endDate = ''
                this.state.endTime = ''
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

    public get endDate(): string {
        return this.state.endDate
    }

    public setEndDate(value: string): void {
        this.state.endDate = value
    }

    public get endTime(): string {
        return this.state.endTime
    }

    public setEndTime(value: string): void {
        this.state.endTime = value
    }

    public get loading(): boolean {
        return this.state.loading
    }

    public get endDateTime(): DateTime {
        return DateTime.fromFormat(
            `${this.state.endDate} ${this.state.endTime}`,
            'yyyy.MM.dd hh:mm',
        )
    }

    public get endDateIsValid(): boolean {
        if (!this.endDateTime.isValid) {
            return false
        }

        if (this.endDateTime.toMillis() <= new Date().getTime()) {
            return false
        }

        return true
    }

}

const farmingEndDateConfigStore = new FarmingEndDateConfigStore(
    useWallet(),
    useFarmingDataStore(),
)

export function useFarmingEndDateConfigStore(): FarmingEndDateConfigStore {
    return farmingEndDateConfigStore
}
