import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'
import { Address } from 'ton-inpage-provider'
import { makeAutoObservable, runInAction, toJS } from 'mobx'

import { FarmingDataStore, useFarmingDataStore } from '@/modules/Farming/stores/FarmingDataStore'
import { useWallet, WalletService } from '@/stores/WalletService'
import { TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import { Farm } from '@/misc'
import { error } from '@/utils'

type State = {
    amounts: string[];
    startDate: string;
    startTime: string;
    loading: boolean;
}

const defaultState: State = Object.freeze({
    amounts: [],
    startDate: '',
    startTime: '',
    loading: false,
})

export class FarmingRoundConfigStore {

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
            throw new Error('Submit reward action is currently loading')
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
            if (!this.rewardIsValid) {
                throw new Error('Reward is invalid')
            }
            if (!this.wallet.address) {
                throw new Error('Wallet must be connected')
            }

            await Farm.poolAdminCreatePeriod(
                new Address(poolAddress),
                new Address(this.wallet.address),
                this.startDateTime.toSeconds().toString(),
                this.reward.map(amount => (amount as BigNumber).toFixed()),
            )

            await this.farmingDataStore.syncData()

            runInAction(() => {
                this.state.amounts = []
                this.state.startDate = ''
                this.state.startTime = ''
            })
        }
        catch (e) {
            error()
        }
        finally {
            runInAction(() => {
                this.state.loading = false
            })
        }
    }

    public setAmount(index: number, value: string): void {
        const amounts = [...this.state.amounts]
        amounts[index] = value
        this.state.amounts = amounts
    }

    public get startDate(): string {
        return this.state.startDate
    }

    public setStartDate(value: string): void {
        this.state.startDate = value
    }

    public get startTime(): string {
        return this.state.startTime
    }

    public setStartTime(value: string): void {
        this.state.startTime = value
    }

    public get amounts(): string[] {
        return toJS(this.state.amounts)
    }

    public get loading(): boolean {
        return this.state.loading
    }

    public get reward(): (BigNumber | undefined)[] {
        const { rewardTokensAddress } = this.farmingDataStore

        if (!rewardTokensAddress) {
            return []
        }

        const tokens = rewardTokensAddress
            .map(address => this.tokensCache.get(address))

        return tokens.map((token, index) => {
            const amount = this.amounts[index]

            if (!token || !amount) {
                return undefined
            }

            return new BigNumber(amount)
                .shiftedBy(token.decimals)
                .decimalPlaces(0, BigNumber.ROUND_DOWN)
        })
    }

    public get startDateTime(): DateTime {
        return DateTime.fromFormat(
            `${this.state.startDate} ${this.state.startTime}`,
            'yyyy.MM.dd hh:mm',
        )
    }

    public get blocked(): boolean {
        return this.farmingDataStore.endTime > 0
    }

    public get rewardIsValid(): boolean {
        const { endTime, roundStartTimes } = this.farmingDataStore

        if (endTime > 0 || !roundStartTimes || !this.startDateTime.isValid) {
            return false
        }

        const startTime = this.startDateTime.toMillis()

        if (startTime <= new Date().getTime()) {
            return false
        }

        const lastRoundStartTime = roundStartTimes[roundStartTimes.length - 1]

        if (startTime <= lastRoundStartTime) {
            return false
        }

        const invalidAmountIndex = this.reward
            .findIndex(amount => (
                !amount || amount.isNaN() || amount.isNegative()
            ))

        return invalidAmountIndex === -1
    }

}

const farmingRoundConfigStore = new FarmingRoundConfigStore(
    useWallet(),
    useFarmingDataStore(),
    useTokensCache(),
)

export function useFarmingRoundConfigStore(): FarmingRoundConfigStore {
    return farmingRoundConfigStore
}
