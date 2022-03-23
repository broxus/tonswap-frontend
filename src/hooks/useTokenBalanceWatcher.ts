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

        if (token !== undefined) {
            (async () => {
                try {
                    if (syncTokenOnMount) {
                        await tokensCache.syncToken(token.root)
                    }
                }
                catch (e) {
                    error('Token update failure', e)
                }
                finally {
                    if (watchOnMount && !syncingTokens[`${subscriberPrefix}-${token.root}`]) {
                        await tokensCache.watch(token.root, subscriberPrefix)
                    }
                }
            })()
        }

        return () => {
            tokenDisposer()

            if (token) {
                syncingTokens[`${subscriberPrefix}-${token.root}`] = false
            }

            if (token && unwatchOnUnmount) {
                tokensCache.unwatch(token.root, subscriberPrefix).catch(reason => error(reason))
            }
        }
    }, [token, token?.wallet])

    return { value: balance, isFetching: tokensCache.isTokenUpdatingBalance(token?.root) }
}
