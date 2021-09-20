import * as React from 'react'

import { Balances, useDexAccount } from '@/stores/DexAccountService'

export function useDexBalances(): Balances | undefined {
    const dexAccount = useDexAccount()
    const [dexBalances, setDexBalances] = React.useState<Balances | undefined>(dexAccount.balances)

    const balancesIsEqual = (prev?: Balances, next?: Balances): boolean => {
        const toString = (balances: Balances) => (
            [...balances.entries()].map(entry => entry.join('')).join('')
        )

        if (prev === undefined && next === undefined) {
            return true
        }

        if (prev && next && toString(prev) === toString(next)) {
            return true
        }

        return false
    }

    React.useEffect(() => {
        if (!balancesIsEqual(dexAccount.balances, dexBalances)) {
            setDexBalances(dexAccount.balances)
        }
    }, [dexAccount.balances])

    return dexBalances
}
