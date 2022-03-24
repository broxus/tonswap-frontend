import * as React from 'react'
import { reaction } from 'mobx'

import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
import { error, formattedBalance } from '@/utils'


export type TokenFormattedBalanceOptions = {
    dexAccountBalance?: string | number;
    subscriberPrefix?: string;
    syncTokenOnMount?: boolean;
    unwatchOnUnmount?: boolean;
    watchOnMount?: boolean;
}

export type TokenFormattedBalanceShape = {
    value: string;
    isFetching: boolean;
}

const syncingTokens: Record<string, boolean> = {}


export function useTokenBalanceWatcher(
    token?: TokenCache,
    options?: TokenFormattedBalanceOptions,
): TokenFormattedBalanceShape {
    const tokensCache = useTokensCache()

    const {
        dexAccountBalance,
        subscriberPrefix = 'sub',
        syncTokenOnMount = true,
        watchOnMount = true,
        unwatchOnUnmount = watchOnMount as boolean,
    } = { ...options }

    const [balance, setBalance] = React.useState(
        formattedBalance(
            token?.balance || 0,
            token?.decimals,
            dexAccountBalance || 0,
        ) || '0',
    )

    React.useEffect(() => {
        setBalance(formattedBalance(
            token?.balance || 0,
            token?.decimals,
            dexAccountBalance || 0,
        ) || '0')
    }, [dexAccountBalance, token?.balance])

    React.useEffect(() => {
        const tokenDisposer = reaction(() => tokensCache.get(token?.root), updatedToken => {
            setBalance(formattedBalance(
                updatedToken?.balance || 0,
                updatedToken?.decimals,
                dexAccountBalance || 0,
            ) || '0')
        })

        if (token?.root !== undefined) {
            (async () => {
                try {
                    if (syncTokenOnMount) {
                        await tokensCache.syncToken(token.root, true)
                    }
                }
                catch (e) {
                    error('Token update failure', e)
                }
                finally {
                    if (watchOnMount && !syncingTokens[`${subscriberPrefix}-${token.root}`]) {
                        syncingTokens[`${subscriberPrefix}-${token.root}`] = true
                        await tokensCache.watch(token.root, subscriberPrefix)
                    }
                }
            })()
        }

        return () => {
            tokenDisposer()

            if (token?.root !== undefined && unwatchOnUnmount) {
                syncingTokens[`${subscriberPrefix}-${token?.root}`] = false
                tokensCache.unwatch(token.root, subscriberPrefix).catch(reason => error(reason))
            }
        }
    }, [token?.root])

    return { value: balance, isFetching: tokensCache.isTokenUpdatingBalance(token?.root) }
}
