import * as React from 'react'

import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
import { error, formatBalance } from '@/utils'


type HookOptions = {
    dexAccountBalance?: string;
    subscriberPrefix?: string;
    watchOnMount?: boolean;
    unwatchOnUnmount?: boolean;
}

type HookShape = {
    balance: string;
    isFetching: boolean;
}


export function useTokenFormattedBalance(
    token?: TokenCache,
    options?: HookOptions,
): HookShape {
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

    const [isFetching, setFetchingTo] = React.useState(false)

    const isMounted = React.useRef<boolean | null>(null)

    React.useEffect(() => {
        setBalance(formatBalance(
            token?.balance || '0',
            token?.decimals,
            dexAccountBalance,
        ) || '0')
    }, [token?.balance])

    React.useEffect(() => {
        if (token) {
            setFetchingTo(true)
            tokensCache.syncToken(token.root).then(() => {
                if (!isMounted.current) {
                    return
                }
                setBalance(formatBalance(
                    token?.balance || '0',
                    token?.decimals,
                    dexAccountBalance,
                ) || '0')
                setFetchingTo(false)
            }).catch(err => {
                error('Token update failure', err)
                if (!isMounted.current) {
                    return
                }
                setFetchingTo(false)
            }).finally(async () => {
                if (!isMounted.current) {
                    return
                }
                if (watchOnMount) {
                    await tokensCache.watch(token.root, subscriberPrefix)
                }
                setFetchingTo(false)
            })
        }

        isMounted.current = true

        return () => {
            if (token && unwatchOnUnmount) {
                tokensCache.unwatch(token.root, subscriberPrefix)
            }
            isMounted.current = false
        }
    }, [token])

    return { balance, isFetching }
}
