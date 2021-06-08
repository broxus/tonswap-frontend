import * as React from 'react'

import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
import { error, formatBalance } from '@/utils'


type HookOptions = {
    dexAccountBalance?: string;
    subscriberPrefix?: string;
    watchOnMount?: boolean;
    unwatchOnUnmount?: boolean;
}


export function useTokenFormattedBalance(
    token?: TokenCache,
    options?: HookOptions,
): string {
    const tokensCache = useTokensCache()

    const {
        dexAccountBalance,
        subscriberPrefix = 'sub',
        watchOnMount = true,
        unwatchOnUnmount = watchOnMount as boolean,
    } = { ...options }

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
                if (watchOnMount) {
                    await tokensCache.watch(token.root, subscriberPrefix)
                }
            })
        }

        return () => {
            if (token && unwatchOnUnmount) {
                tokensCache.unwatch(token.root, subscriberPrefix)
            }
        }
    }, [token])

    return balance
}
