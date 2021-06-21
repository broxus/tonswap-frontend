import * as React from 'react'

import { usePool } from '@/modules/Pool/stores/PoolStore'
import { PoolStoreData, TokenSide } from '@/modules/Pool/types'
import { TokenCache } from '@/stores/TokensCacheService'


type PoolFormShape = {
    isTokenListShown: boolean;
    tokenSide: TokenSide | null;
    hideTokensList(): void;
    showTokensList(side: TokenSide): () => void;
    onChangeData<K extends keyof PoolStoreData>(key: K): (value: PoolStoreData[K]) => void;
    onSelectToken(token: TokenCache): void;
    onDismissTransactionReceipt(): void;
}


export function usePoolForm(): PoolFormShape {
    const pool = usePool()

    const [isTokenListShown, setTokenListVisible] = React.useState(false)

    const [tokenSide, setTokenSide] = React.useState<TokenSide | null>(null)

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
        pool.init()
        return () => {
            pool.dispose()
        }
    }, [])

    return {
        isTokenListShown,
        tokenSide,
        hideTokensList,
        showTokensList,
        onChangeData,
        onSelectToken,
        onDismissTransactionReceipt,
    }
}
