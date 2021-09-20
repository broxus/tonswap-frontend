import * as React from 'react'
import { reaction } from 'mobx'
import { useHistory, useParams } from 'react-router-dom'

import { isAddressValid, TokenWallet } from '@/misc'
import { usePool } from '@/modules/Pool/stores/PoolStore'
import { PoolStoreData, TokenSide } from '@/modules/Pool/types'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
import { useWallet } from '@/stores/WalletService'
import { debounce, error } from '@/utils'


type PoolFormShape = {
    isImporting: boolean;
    isTokenListShown: boolean;
    tokenSide: TokenSide | null;
    tokenToImport: TokenCache | undefined;
    debouncedSyncPoolShare: () => void;
    hideTokensList: () => void;
    showTokensList: (side: TokenSide) => () => void;
    onChangeData: <K extends keyof PoolStoreData>(key: K) => (value: PoolStoreData[K]) => void;
    onDismissImporting: () => void;
    onSelectToken: (root: string) => void;
    onDismissTransactionReceipt: () => void;
}


export function usePoolForm(): PoolFormShape {
    const pool = usePool()
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

    const [isImporting, setImportingTo] = React.useState(false)

    const [tokenToImport, setTokenToImport] = React.useState<TokenCache>()

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

    const onSelectToken = (root: string) => {
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

    const onDismissImporting = () => {
        setImportingTo(false)
    }

    const onDismissTransactionReceipt = () => {
        pool.cleanDepositLiquidityResult()
    }

    React.useEffect(() => {
        // Initial update tokens state by the given uri params and after list of the tokens loaded
        const tokensListDisposer = reaction(() => tokensCache.tokens, () => {
            // noinspection DuplicatedCode
            if (
                leftTokenRoot !== undefined
                && !tokensCache.has(leftTokenRoot)
                && isAddressValid(leftTokenRoot)
            ) {
                (async () => {
                    try {
                        const token = await TokenWallet.getTokenData(leftTokenRoot)
                        setImportingTo(true)
                        if (token !== undefined) {
                            setTokenToImport(token)
                        }
                        pool.changeData('leftToken', leftTokenRoot)
                    }
                    catch (e) {}
                })()
                return
            }

            if (
                rightTokenRoot !== undefined
                && !tokensCache.has(rightTokenRoot)
                && isAddressValid(rightTokenRoot)
            ) {
                (async () => {
                    try {
                        const token = await TokenWallet.getTokenData(rightTokenRoot)
                        setImportingTo(true)
                        if (token !== undefined) {
                            setTokenToImport(token)
                        }
                        pool.changeData('rightToken', rightTokenRoot)
                    }
                    catch (e) {}
                })()
                return
            }

            if (
                (pool.leftToken === undefined || pool.leftToken.root !== leftTokenRoot)
                && tokensCache.has(leftTokenRoot)
            ) {
                pool.changeData('leftToken', leftTokenRoot)
            }

            if (
                (pool.rightToken === undefined || pool.rightToken.root !== rightTokenRoot)
                && tokensCache.has(rightTokenRoot)
            ) {
                pool.changeData('rightToken', rightTokenRoot)
            }
        });

        (async () => {
            await pool.init()
        })()

        return () => {
            pool.dispose().catch(reason => error(reason))
            tokensListDisposer()
        }
    }, [])

    // Update tokens state after change the uri params
    React.useEffect(() => {
        if (leftTokenRoot !== undefined && tokensCache.has(leftTokenRoot)) {
            pool.changeData('leftToken', leftTokenRoot)
        }

        if (rightTokenRoot !== undefined && tokensCache.has(rightTokenRoot)) {
            pool.changeData('rightToken', rightTokenRoot)
        }
    }, [leftTokenRoot, rightTokenRoot, wallet.address])

    return {
        isImporting,
        isTokenListShown,
        tokenSide,
        tokenToImport,
        debouncedSyncPoolShare,
        hideTokensList,
        showTokensList,
        onChangeData,
        onDismissImporting,
        onSelectToken,
        onDismissTransactionReceipt,
    }
}
