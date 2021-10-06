import { makeAutoObservable } from 'mobx'

import { useWallet, WalletService } from '@/stores/WalletService'
import {
    error, isObject, isString, storage as storageInstance,
} from '@/utils'

type Storage = {
    get: (ket: string) => string | null
    set: (key: string, value: string) => void
}

type PairData = {
    address: string,
    name?: string,
}

type Data = {
    [key: string]: PairData[]
}

type State = {
    data: Data
}

export class FavoritePairs {

    protected state: State = {
        data: {},
    }

    constructor(
        protected readonly storage: Storage,
        protected readonly wallet: WalletService,
        protected readonly storageKey: string,
    ) {
        this.syncWithStorage()
        makeAutoObservable(this)

        window.addEventListener('storage', e => {
            if (e.key === this.storageKey) {
                this.syncWithStorage()
            }
        })
    }

    private has(address: string): boolean {
        if (!this.wallet.address) {
            return false
        }

        const addresses = this.state.data[this.wallet.address]

        if (!addresses) {
            return false
        }

        return Boolean(addresses.find(item => item.address === address))
    }

    public add(address: string, name?: string): void {
        if (!this.wallet.address) {
            return
        }

        if (this.has(address)) {
            return
        }

        const newItem = { name, address }
        this.state.data[this.wallet.address] = this.state.data[this.wallet.address]
            ? [...this.state.data[this.wallet.address], newItem]
            : [newItem]
        this.saveToStorage()
    }

    public remove(address: string): void {
        if (!this.wallet.address) {
            return
        }

        if (!this.has(address)) {
            return
        }

        const index = this.state.data[this.wallet.address]
            .findIndex(item => item.address === address)
        this.state.data[this.wallet.address].splice(index, 1)
        this.saveToStorage()
    }

    public toggle(address: string, name?: string): void {
        if (this.has(address)) {
            this.remove(address)
        }
        else {
            this.add(address, name)
        }
    }

    public saveToStorage(): void {
        const storageData = JSON.stringify(this.state.data)
        this.storage.set(this.storageKey, storageData)
    }

    public syncWithStorage(): void {
        this.state.data = this.readFromStorage()
    }

    public readFromStorage(): Data {
        const storageData = this.storage.get(this.storageKey)

        if (!storageData) {
            return {}
        }

        try {
            const data: unknown = JSON.parse(storageData)

            if (!isObject(data)) {
                return {}
            }

            return Object.entries(data as {[key: string]: unknown})
                .reduce((acc, [key, value]) => {
                    if (Array.isArray(value)) {
                        acc[key] = value.filter(item => (
                            isObject(item)
                            && (item.name ? isString(item.name) : true)
                            && isString(item.address)
                        ))
                    }
                    return acc
                }, {} as Data)
        }
        catch (e) {
            error(e)
        }

        return {}
    }

    public filterData(query?: string): PairData[] {
        if (!this.wallet.address) {
            return []
        }

        const addresses = this.state.data[this.wallet.address] || []
        const data = query
            ? addresses.filter(({ name }) => (
                name && name.toLocaleLowerCase().indexOf(query) > -1
            ))
            : addresses

        return FavoritePairs.sortByName(data)
    }

    static sortByName(data: PairData[]): PairData[] {
        return data.sort((a, b) => {
            if (!a.name) {
                return 1
            }
            if (!b.name) {
                return -1
            }
            if (a.name < b.name) {
                return -1
            }
            if (a.name > b.name) {
                return 1
            }
            return 0
        })
    }

    public get count(): number {
        if (!this.wallet.address) {
            return 0
        }

        const addresses = this.state.data[this.wallet.address] || []
        return addresses.length
    }

    public get data(): PairData[] {
        if (!this.wallet.address) {
            return []
        }

        return this.state.data[this.wallet.address] || []
    }

    public get addresses(): string[] {
        const address = this.data
        return address.map(item => item.address)
    }

    public get isConnected(): boolean {
        return this.wallet.isConnected
    }

}

const favoritePairs = new FavoritePairs(
    storageInstance,
    useWallet(),
    'favorite_pairs',
)

const favoriteFarmings = new FavoritePairs(
    storageInstance,
    useWallet(),
    'favorite_farmings',
)

export const useFavoritePairs = (): FavoritePairs => favoritePairs
export const useFavoriteFarmings = (): FavoritePairs => favoriteFarmings
