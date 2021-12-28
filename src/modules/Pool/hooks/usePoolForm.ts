import * as React from 'react'
import { reaction } from 'mobx'
import { useHistory, useParams } from 'react-router-dom'

import { isAddressValid } from '@/misc'
import { usePoolStore } from '@/modules/Pool/stores/PoolStore'
import { PoolStoreData, TokenSide } from '@/modules/Pool/types'
import { useTokensCache } from '@/stores/TokensCacheService'
import { useWallet } from '@/stores/WalletService'
import { debounce, debug, error } from '@/utils'


type PoolFormShape = {
    isTokenListShown: boolean;
    tokenSide: TokenSide | null;
    debouncedSyncPoolShare: () => void;
    hideTokensList: () => void;
    showTokensList: (side: TokenSide) => () => void;
    onChangeData: <K extends keyof PoolStoreData>(key: K) => (value: PoolStoreData[K]) => void;
    onSelectToken: (root: string) => void;
    onDismissTransactionReceipt: () => void;
}


export function usePoolForm(): PoolFormShape {
    const pool = usePoolStore()
    const {
        leftTokenRoot,
        rightTokenRoot,
    } = useParams<{
        leftTokenRoot: string,
        rightTokenRoot: string,
    }>()
    const history = useHistory()
    const tokensCache = useTokensCache()
    const wallet = useWallet()

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

    const updateTokens = (leftRoot: string, rightRoot: string) => {
        if (!isAddressValid(leftRoot) && !isAddressValid(leftRoot)) {
            return
        }

        pool.changeData('leftToken', leftRoot)
        pool.changeData('rightToken', rightRoot)

        if (tokensCache.tokens.length > 0) {
            const isLeftRootValid = isAddressValid(leftRoot)
            const isRightRootValid = isAddressValid(rightRoot)
            const leftInCache = pool.leftToken !== undefined
            const rightInCache = pool.rightToken !== undefined;

            (async () => {
                try {
                    if (isLeftRootValid && !leftInCache) {
                        debug('Try to fetch left token')
                        await tokensCache.addToImportQueue(leftRoot)
                    }
                }
                catch (e) {
                    error(e)
                }

                try {
                    if (isRightRootValid && !rightInCache) {
                        debug('Try to fetch right token')
                        await tokensCache.addToImportQueue(rightRoot)
                    }
                }
                catch (e) {
                    error(e)
                }
            })()
        }
    }

    const onChangeData: PoolFormShape['onChangeData'] = key => value => {
        pool.changeData(key, value)
    }

    const onSelectToken: PoolFormShape['onSelectToken'] = root => {
        let pathname = '/pool'
        if (tokenSide === 'leftToken') {
            const rightRoot = (pool.rightToken?.root !== undefined && pool.rightToken.root !== root)
                ? `/${pool.rightToken.root}`
                : ''
            pathname += `/${root}${rightRoot}`
        }
        else if (
            tokenSide === 'rightToken'
            && pool.leftToken?.root !== undefined
            && pool.leftToken.root !== root
        ) {
            pathname += `/${pool.leftToken.root}/${root}`
        }
        else if (tokenSide) {
            pool.changeData(tokenSide, root)
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

        const tokensListDisposer = reaction(
            () => [tokensCache.tokens, tokensCache.customTokens],
            () => {
                updateTokens(leftTokenRoot, rightTokenRoot)
            },
        )

        return () => {
            pool.dispose().catch(reason => error(reason))
            tokensListDisposer()
        }
    }, [])

    // Update tokens state after change the uri params
    React.useEffect(() => {
        updateTokens(leftTokenRoot, rightTokenRoot)
    }, [leftTokenRoot, rightTokenRoot, wallet.address])

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
