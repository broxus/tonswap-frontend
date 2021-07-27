import * as React from 'react'

import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
import { error, formatBalance } from '@/utils'


type TokenFormattedBalanceOptions = {
    dexAccountBalance?: string;
    subscriberPrefix?: string;
    watchOnMount?: boolean;
    unwatchOnUnmount?: boolean;
}

type TokenFormattedBalanceShape = {
    balance: string;
    isFetching: boolean;
}


const mountedTokens: Record<string, boolean> = {}


export function useTokenFormattedBalance(
    token?: TokenCache,
    options?: TokenFormattedBalanceOptions,
): TokenFormattedBalanceShape {
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

    React.useEffect(() => {
        setBalance(formatBalance(
            token?.balance || '0',
            token?.decimals,
            dexAccountBalance,
        ) || '0')
    }, [token?.balance])

    React.useEffect(() => {
        if (token) {
            mountedTokens[`${subscriberPrefix}-${token.root}`] = true;

            (async () => {
                setFetchingTo(true)
                await tokensCache.syncToken(token.root).then(() => {
                    if (!mountedTokens[`${subscriberPrefix}-${token.root}`]) {
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
                    if (!mountedTokens[`${subscriberPrefix}-${token.root}`]) {
                        return
                    }
                    setFetchingTo(false)
                }).finally(async () => {
                    if (watchOnMount) {
                        await tokensCache.watch(token.root, subscriberPrefix)
                    }
                    if (!mountedTokens[`${subscriberPrefix}-${token.root}`]) {
                        return
                    }
                    setFetchingTo(false)
                })
            })()
        }

        return () => {
            if (token) {
                mountedTokens[`${subscriberPrefix}-${token.root}`] = false
            }

            if (token && unwatchOnUnmount) {
                tokensCache.unwatch(token.root, subscriberPrefix).catch(err => error(err))
            }
        }
    }, [token])

    return { balance, isFetching }
}
