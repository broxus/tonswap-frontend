import * as React from 'react'

import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
import { error, formatBalance } from '@/utils'


export function useTokenFormattedBalance(
    token?: TokenCache,
    dexAccountBalance?: string,
): string {
    const tokensCache = useTokensCache()

    const [balance, setBalance] = React.useState(
        formatBalance(
            token?.balance || '0',
            token?.decimals,
            dexAccountBalance,
        ) || '0',
    )

    React.useEffect(() => {
        setBalance(formatBalance(
            token?.balance || '0',
            token?.decimals,
            dexAccountBalance,
        ) || '0')
    }, [token?.balance])

    React.useEffect(() => {
        if (token) {
            tokensCache.syncToken(token.root).then(() => {
                setBalance(formatBalance(
                    token?.balance || '0',
                    token?.decimals,
                    dexAccountBalance,
                ) || '0')
            }).catch(err => {
                error('Token update failure', err)
            }).finally(async () => {
                await tokensCache.watch(token.root)
            })
        }

        return () => {
            if (token) {
                tokensCache.unwatch(token.root)
            }
        }
    }, [token])

    return balance
}
