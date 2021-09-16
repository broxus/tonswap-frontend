import { makeAutoObservable } from 'mobx'
import { Address } from 'ton-inpage-provider'

import { DexAccountService, useDexAccount } from '@/stores/DexAccountService'
import { useWallet, WalletService } from '@/stores/WalletService'
import {
    error, isObject, isString, storage as storageInstance,
} from '@/utils'

const STORAGE_KEY = 'favorite_pairs'

type Storage = {
    get: (ket: string) => string | null
    set: (key: string, value: string) => void
}

type AddressData = {
    address: Address,
    name?: string,
}

type State = {
    data: AddressData[]
}

export class FavoritePairs {

    protected state: State = {
        data: [],
    }

    constructor(
        protected readonly storage: Storage,
        protected readonly dexAccount: DexAccountService,
        protected readonly wallet: WalletService,
    ) {
        this.syncWithStorage()
        makeAutoObservable(this)

        window.addEventListener('storage', e => {
            if (e.key === STORAGE_KEY) {
                this.syncWithStorage()
            }
        })
    }

    private has(rawAddress: string): boolean {
        return Boolean(this.state.data
            .find(item => item.address.toString() === rawAddress))
    }

    public add(rawAddress: string, name?: string): void {
        if (this.has(rawAddress)) {
            return
        }

        this.state.data.push({
            name,
            address: new Address(rawAddress),
        })
        this.saveToStorage()
    }

    public remove(rawAddress: string): void {
        if (!this.has(rawAddress)) {
            return
        }

        const index = this.state.data
            .findIndex(item => item.address.toString() === rawAddress)
        this.state.data.splice(index, 1)
        this.saveToStorage()
    }

    public toggle(rawAddress: string, name?: string): void {
        if (this.has(rawAddress)) {
            this.remove(rawAddress)
        }
        else {
            this.add(rawAddress, name)
        }
    }

    public saveToStorage(): void {
        const rawData = this.state.data.map(item => ({
            address: item.address.toString(),
            name: item.name,
        }))
        const storageData = JSON.stringify(rawData)
        this.storage.set(STORAGE_KEY, storageData)
    }

    public syncWithStorage(): void {
        this.state.data = this.readFromStorage()
    }

    public readFromStorage(): AddressData[] {
        const storageData = this.storage.get(STORAGE_KEY)

        if (!storageData) {
            return []
        }

        try {
            const data: unknown = JSON.parse(storageData)

            if (!Array.isArray(data)) {
                return []
            }

            return (data as Array<unknown>)
                .filter(item => {
                    const addressIsValid = isObject(item) && isString((item as {address: unknown}).address)
                    const nameIsValid = isObject(item) && (item as {name: unknown}).name
                        ? isString((item as {name: unknown}).name)
                        : true
                    return addressIsValid && nameIsValid
                })
                .map(item => ({
                    name: (item as {name: string | undefined}).name,
                    address: new Address((item as {address: string}).address),
                }))
        }
        catch (e) {
            error(e)
        }

        return []
    }

    public filterData(query?: string): AddressData[] {
        const data = query
            ? this.state.data.filter(({ name }) => (
                name && name.toLocaleLowerCase().indexOf(query) > -1
            ))
            : [...this.state.data]

        return FavoritePairs.sortByName(data)
    }

    static sortByName(data: AddressData[]): AddressData[] {
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
        return this.state.data.length
    }

    public get data(): AddressData[] {
        return this.state.data
    }

    public get addresses(): string[] {
        return this.state.data.map(item => item.address.toString())
    }

}

const favoritePairs = new FavoritePairs(
    storageInstance,
    useDexAccount(),
    useWallet(),
)

export const useFavoritePairs = (): FavoritePairs => favoritePairs
