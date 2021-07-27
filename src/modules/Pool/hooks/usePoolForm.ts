import * as React from 'react'

import { usePool } from '@/modules/Pool/stores/PoolStore'
import { PoolStoreData, TokenSide } from '@/modules/Pool/types'
import { TokenCache } from '@/stores/TokensCacheService'
import { debounce, error } from '@/utils'


type PoolFormShape = {
    isTokenListShown: boolean;
    tokenSide: TokenSide | null;
    debouncedSyncPoolShare: () => void;
    hideTokensList: () => void;
    showTokensList: (side: TokenSide) => () => void;
    onChangeData: <K extends keyof PoolStoreData>(key: K) => (value: PoolStoreData[K]) => void;
    onSelectToken: (token: TokenCache) => void;
    onDismissTransactionReceipt: () => void;
}


export function usePoolForm(): PoolFormShape {
    const pool = usePool()

    const [isTokenListShown, setTokenListVisible] = React.useState(false)

    const [tokenSide, setTokenSide] = React.useState<TokenSide | null>(null)

    const debouncedSyncPoolShare = debounce(async () => {
        await pool.fetchPoolShare()
    }, 500)

    const hideTokensList = () => {
        setTokenSide(null)
        setTokenListVisible(false)
    }

    const showTokensList = (side: TokenSide) => () => {
        if (
            pool.isDepositingRight
            || pool.isDepositingLeft
            || pool.isDepositingLiquidity
            || pool.isSyncPairBalances
            || pool.isSyncPairRoots
        ) {
            return
        }

        setTokenSide(side)
        setTokenListVisible(true)
    }

    const onChangeData = <K extends keyof PoolStoreData>(key: K) => (value: PoolStoreData[K]) => {
        pool.changeData(key, value)
    }

    const onSelectToken = (token: TokenCache) => {
        if (tokenSide) {
            pool.changeData(tokenSide, token)
            hideTokensList()
        }
    }

    const onDismissTransactionReceipt = () => {
        pool.cleanDepositLiquidityResult()
    }

    React.useEffect(() => {
        (async () => {
            await pool.init()
        })()
        return () => {
            pool.dispose().catch(err => error(err))
        }
    }, [])

    return {
        isTokenListShown,
        tokenSide,
        debouncedSyncPoolShare,
        hideTokensList,
        showTokensList,
        onChangeData,
        onSelectToken,
        onDismissTransactionReceipt,
    }
}
