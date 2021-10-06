import BigNumber from 'bignumber.js'
import { Address } from 'ton-inpage-provider'
import { makeAutoObservable, runInAction } from 'mobx'

import { FarmingDataStore, useFarmingDataStore } from '@/modules/Farming/stores/FarmingDataStore'
import { useWallet, WalletService } from '@/stores/WalletService'
import { executeAction } from '@/modules/Farming/utils'
import { Farm, TokenWallet } from '@/misc'
import { error } from '@/utils'

type State = {
    loading: boolean;
    amount: string;
}

const defaultState: State = Object.freeze({
    loading: false,
    amount: '',
})

export class FarmingDepositStore {

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

    public async deposit(): Promise<void> {
        if (this.state.loading === true) {
            throw new Error('Deposit action is currently loading')
        }

        runInAction(() => {
            this.state.loading = true
        })

        try {
            await this.farmingDataStore.syncData()

            const {
                poolAddress, userLpWalletAddress, poolWalletAddress,
                lpTokenDecimals,
            } = this.farmingDataStore
            const { amount } = this.state
            const ownerAddress = this.wallet.address

            if (!amount || !this.amountIsValid) {
                throw new Error('Deposit amount is invalid')
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
            if (!poolWalletAddress) {
                throw new Error('Pool wallet address must be exists in farming data store')
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
                async () => TokenWallet.send({
                    address: new Address(userLpWalletAddress),
                    owner: new Address(ownerAddress),
                    recipient: new Address(poolWalletAddress),
                    tokens: amountBN.toFixed(),
                    grams: '5000000000',
                    payload: await Farm.poolDepositPayload(
                        new Address(poolAddress),
                        new Address(ownerAddress),
                    ),
                }),
                'Deposit',
            )

            await this.farmingDataStore.syncData()

            runInAction(() => {
                this.state.amount = ''
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

    public get amountIsValid(): boolean {
        const { userLpWalletAmount, lpTokenDecimals } = this.farmingDataStore

        if (!userLpWalletAmount || !this.state.amount || !lpTokenDecimals) {
            return false
        }

        const amountBN = new BigNumber(this.state.amount)
            .shiftedBy(lpTokenDecimals)
            .decimalPlaces(0)

        return !amountBN.isNaN()
            && amountBN.isLessThanOrEqualTo(userLpWalletAmount)
            && amountBN.isGreaterThan(0)
    }

    public get loading(): boolean {
        return this.state.loading
    }

    public get amount(): string {
        return this.state.amount
    }

    public setAmount(value: string): void {
        this.state.amount = value
    }

}

const farmingDepositStore = new FarmingDepositStore(
    useWallet(),
    useFarmingDataStore(),
)

export function useFarmingDepositStore(): FarmingDepositStore {
    return farmingDepositStore
}
