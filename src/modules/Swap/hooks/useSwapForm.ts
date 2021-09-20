import * as React from 'react'
import { reaction } from 'mobx'
import { useHistory, useParams } from 'react-router-dom'

import { isAddressValid, TokenWallet } from '@/misc'
import { DEFAULT_LEFT_TOKEN_ROOT, DEFAULT_RIGHT_TOKEN_ROOT } from '@/modules/Swap/constants'
import { useSwapStore } from '@/modules/Swap/stores/SwapStore'
import { SwapDirection, SwapStoreData } from '@/modules/Swap/types'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
import { debounce, error } from '@/utils'


type TokenSide = keyof Pick<SwapStoreData, 'leftToken' | 'rightToken'>

type SwapFormShape = {
    isImporting: boolean;
    isTokenListShown: boolean;
    tokenSide: TokenSide | null;
    tokenToImport: TokenCache | undefined;
    hideTokensList: () => void;
    showTokensList: (side: TokenSide) => () => void;
    toggleTokensDirection: () => void;
    onChangeLeftAmount: (value: SwapStoreData['leftAmount']) => void;
    onChangeRightAmount: (value: SwapStoreData['rightAmount']) => void;
    onKeyPress: () => void;
    onDismissImporting: () => void;
    onSelectToken: (root: string) => void;
    onDismissTransactionReceipt: () => void;
}


export function useSwapForm(): SwapFormShape {
    const swap = useSwapStore()
    const {
        leftTokenRoot,
        rightTokenRoot,
    } = useParams<{
        leftTokenRoot: string,
        rightTokenRoot: string,
    }>()
    const history = useHistory()
    const tokensCache = useTokensCache()

    const [isImporting, setImportingTo] = React.useState(false)

    const [tokenToImport, setTokenToImport] = React.useState<TokenCache>()

    const [isTokenListShown, setTokenListVisible] = React.useState(false)

    const [tokenSide, setTokenSide] = React.useState<TokenSide | null>(null)

    const hideTokensList = () => {
        setTokenSide(null)
        setTokenListVisible(false)
    }

    const showTokensList = (side: TokenSide) => () => {
        if (swap.isLoading) {
            return
        }

        setTokenSide(side)
        setTokenListVisible(true)
    }

    const checkForDefaults = () => {
        if (
            leftTokenRoot === undefined
            && swap.leftToken === undefined
            && tokensCache.has(DEFAULT_LEFT_TOKEN_ROOT)
        ) {
            swap.changeData('leftToken', DEFAULT_LEFT_TOKEN_ROOT)
        }

        if (
            rightTokenRoot === undefined
            && swap.rightToken === undefined
            && tokensCache.has(DEFAULT_RIGHT_TOKEN_ROOT)
        ) {
            swap.changeData('rightToken', DEFAULT_RIGHT_TOKEN_ROOT)
        }
    }

    const toggleTokensDirection = async () => {
        if (swap.isLoading || swap.isSwapping) {
            return
        }

        await swap.toggleDirection()

        if (swap.leftToken?.root !== undefined && swap.rightToken?.root !== undefined) {
            history.replace(`/swap/${swap.leftToken?.root}/${swap.rightToken?.root}`)
        }
        else if (swap.leftToken?.root !== undefined && swap.rightToken?.root === undefined) {
            history.replace(`/swap/${swap.leftToken?.root}`)
        }
    }

    const onKeyPress: SwapFormShape['onKeyPress'] = React.useCallback(debounce(() => {
        (async () => {
            await swap.recalculate(true)
        })()
    }, 400), [swap.isCalculating])

    const onChangeLeftAmount: SwapFormShape['onChangeLeftAmount'] = value => {
        if (swap.direction === SwapDirection.RTL) {
            swap.changeState('direction', SwapDirection.LTR)
        }

        swap.changeData('leftAmount', value)

        if (value.length === 0) {
            swap.changeData('rightAmount', '')
            swap.forceInvalidate()
            if (swap.pair !== undefined) {
                swap.toDirectSwap()
            }
        }

        onKeyPress()
    }

    const onChangeRightAmount: SwapFormShape['onChangeRightAmount'] = value => {
        if (swap.direction === SwapDirection.LTR) {
            swap.changeState('direction', SwapDirection.RTL)
        }

        swap.changeData('rightAmount', value)

        if (value.length === 0) {
            swap.changeData('leftAmount', '')
            swap.forceInvalidate()
            if (swap.pair !== undefined) {
                swap.toDirectSwap()
            }
        }

        onKeyPress()
    }

    const onDismissImporting = () => {
        setImportingTo(false)
    }

    const onSelectToken: SwapFormShape['onSelectToken'] = async root => {
        let pathname = '/swap'
        if (tokenSide === 'leftToken' && swap.rightToken?.root !== undefined) {
            let rightRoot = swap.rightToken.root
            if (swap.leftToken?.root !== undefined && swap.rightToken.root === root) {
                pathname += `/${root}/${swap.leftToken.root}`
                rightRoot = swap.leftToken.root
            }
            else {
                pathname += `/${root}/${swap.rightToken.root}`
            }
            swap.changeData('leftToken', root)
            swap.changeData('rightToken', rightRoot)
        }
        else if (tokenSide === 'rightToken' && swap.leftToken?.root !== undefined) {
            let leftRoot = swap.leftToken.root
            if (swap.rightToken?.root !== undefined && swap.leftToken.root === root) {
                pathname += `/${swap.rightToken.root}/${root}`
                leftRoot = swap.rightToken.root
            }
            else {
                pathname += `/${swap.leftToken.root}/${root}`
            }
            swap.changeData('rightToken', root)
            swap.changeData('leftToken', leftRoot)
        }
        else if (tokenSide) {
            swap.changeData(tokenSide, root)
        }
        swap.toDirectSwap()
        history.push({ pathname })
        hideTokensList()
    }

    const onDismissTransactionReceipt = () => {
        swap.cleanTransactionResult()
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
                        swap.changeData('leftToken', leftTokenRoot)
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
                        swap.changeData('rightToken', rightTokenRoot)
                    }
                    catch (e) {}
                })()
                return
            }

            if (
                (swap.leftToken === undefined || swap.leftToken.root !== leftTokenRoot)
                && tokensCache.has(leftTokenRoot)
            ) {
                swap.changeData('leftToken', leftTokenRoot)
            }

            if (
                (swap.rightToken === undefined || swap.rightToken.root !== rightTokenRoot)
                && tokensCache.has(rightTokenRoot)
            ) {
                swap.changeData('rightToken', rightTokenRoot)
            }

            checkForDefaults()
        })

        checkForDefaults();

        (async () => {
            await swap.init()
        })()

        return () => {
            swap.dispose().catch(reason => error(reason))
            tokensListDisposer()
        }
    }, [])

    // Update tokens state after change the uri params
    // React.useEffect(() => {
    //     if (leftTokenRoot !== undefined && tokensCache.has(leftTokenRoot)) {
    //         swap.changeData('leftToken', leftTokenRoot)
    //     }
    //
    //     if (rightTokenRoot !== undefined && tokensCache.has(rightTokenRoot)) {
    //         swap.changeData('rightToken', rightTokenRoot)
    //     }
    // }, [leftTokenRoot, rightTokenRoot])

    return {
        isImporting,
        isTokenListShown,
        tokenSide,
        tokenToImport,
        hideTokensList,
        showTokensList,
        toggleTokensDirection,
        onChangeLeftAmount,
        onChangeRightAmount,
        onDismissImporting,
        onKeyPress,
        onSelectToken,
        onDismissTransactionReceipt,
    }
}
