import * as React from 'react'
import { reaction } from 'mobx'
import { useHistory, useParams } from 'react-router-dom'

import { usePool } from '@/modules/Pool/stores/PoolStore'
import { PoolStoreData, TokenSide } from '@/modules/Pool/types'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
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
    const {
        leftTokenAddress,
        rightTokenAddress,
    } = useParams<{ leftTokenAddress: string, rightTokenAddress: string }>()
    const history = useHistory()
    const tokensCache = useTokensCache()

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
        let pathname = '/pool'
        if (tokenSide === 'leftToken') {
            const rightTokenRoot = (pool.rightToken?.root !== undefined && pool.rightToken.root !== token.root)
                ? `/${pool.rightToken.root}`
                : ''
            pathname += `/${token.root}${rightTokenRoot}`
        }
        else if (
            tokenSide === 'rightToken'
            && pool.leftToken?.root !== undefined
            && pool.leftToken.root !== token.root
        ) {
            pathname += `/${pool.leftToken.root}/${token.root}`
        }
        else if (tokenSide) {
            pool.changeData(tokenSide, token)
        }
        history.push({ pathname })
        hideTokensList()
    }

    const onDismissTransactionReceipt = () => {
        pool.cleanDepositLiquidityResult()
    }

    React.useEffect(() => {
        (async () => {
            await pool.init()
        })()

        // Initial update tokens state by the given uri params and after list of the tokens loaded
        const tokensListDisposer = reaction(() => tokensCache.tokens, () => {
            if (
                (!pool.leftToken || pool.leftToken.root !== leftTokenAddress)
                && tokensCache.get(leftTokenAddress) !== undefined
            ) {
                pool.changeData('leftToken', tokensCache.get(leftTokenAddress))
            }

            if (
                (!pool.rightToken || pool.rightToken.root !== rightTokenAddress)
                && tokensCache.get(rightTokenAddress) !== undefined
            ) {
                pool.changeData('rightToken', tokensCache.get(rightTokenAddress))
            }
        })

        return () => {
            pool.dispose().catch(reason => error(reason))
            tokensListDisposer()
        }
    }, [])

    // Update tokens state after change the uri params
    React.useEffect(() => {
        if (leftTokenAddress !== undefined && tokensCache.get(leftTokenAddress) !== undefined) {
            pool.changeData('leftToken', tokensCache.get(leftTokenAddress))
        }
        if (rightTokenAddress !== undefined && tokensCache.get(rightTokenAddress) !== undefined) {
            pool.changeData('rightToken', tokensCache.get(rightTokenAddress))
        }
    }, [leftTokenAddress, rightTokenAddress])

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
