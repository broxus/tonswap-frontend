import * as React from 'react'

import { PairStore } from '@/modules/Pairs/stores/PairStore'


type Props = {
    address: string;
    children: React.ReactChild;
}


export const Context = React.createContext<PairStore>(new PairStore(''))

export function usePairStore(): PairStore {
    return React.useContext(Context)
}

export function PairStoreProvider({ address, children }: Props): JSX.Element {
    const store = React.useMemo(() => new PairStore(address), [address])

    React.useEffect(() => {
        (async () => {
            try {
                await store.load()
                await store.loadTransactions()
            }
            catch (e) {}
        })()
        return () => store.dispose()
    }, [address])

    return (
        <Context.Provider value={store}>
            {children}
        </Context.Provider>
    )
}
