import * as React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { reaction } from 'mobx'

import { isAddressValid } from '@/misc'
import { DEFAULT_LEFT_TOKEN_ROOT, DEFAULT_RIGHT_TOKEN_ROOT } from '@/modules/Swap/constants'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import type { BaseSwapStoreData } from '@/modules/Swap/types'
import { SwapExchangeMode } from '@/modules/Swap/types'
import { debounce, debug, error } from '@/utils'
import type { TokenSide } from '@/modules/TokensList'


type SwapFormShape = {
    isTokenListShown: boolean;
    tokenSide: TokenSide | undefined;
    hideTokensList: () => void;
    showTokensList: (side: TokenSide) => () => void;
    toggleConversionDirection: () => void;
    toggleSwapDirection: () => void;
    onChangeLeftAmount: (value: BaseSwapStoreData['leftAmount']) => void;
    onChangeRightAmount: (value: BaseSwapStoreData['rightAmount']) => void;
    onSelectMultipleSwap: () => void;
    onSelectLeftNativeCoin: () => void;
    onSelectRightNativeCoin: () => void;
    onSelectLeftToken: (root: string) => void;
    onSelectRightToken: (root: string) => void;
    onDismissTransactionReceipt: () => void;
}


export function useSwapForm(): SwapFormShape {
    const formStore = useSwapFormStore()
    const tokensCache = formStore.useTokensCache
    const {
        leftTokenRoot,
        rightTokenRoot,
    } = useParams<{
        leftTokenRoot: string,
        rightTokenRoot: string,
    }>()
    const history = useHistory()

    const [isTokenListShown, setTokenListVisible] = React.useState(false)

    const [tokenSide, setTokenSide] = React.useState<TokenSide>()

    const hideTokensList = () => {
        setTokenSide(undefined)
        setTokenListVisible(false)
    }

    const showTokensList = (side: TokenSide) => () => {
        if (formStore.isLoading) {
            return
        }

        setTokenSide(side)
        setTokenListVisible(true)
    }

    const updateUrl = (force: boolean = false) => {
        if (tokensCache.isImporting) {
            return
        }

        if (
            !force
            && formStore.leftToken?.root === DEFAULT_LEFT_TOKEN_ROOT
            && formStore.rightToken?.root === DEFAULT_RIGHT_TOKEN_ROOT
            && !leftTokenRoot
            && !rightTokenRoot
        ) {
            return
        }

        if (formStore.leftToken?.root !== undefined && formStore.rightToken?.root !== undefined) {
            history.replace(`/swap/${formStore.leftToken?.root}/${formStore.rightToken?.root}`)
        }
        else if (formStore.leftToken?.root !== undefined && formStore.rightToken?.root === undefined) {
            history.replace(`/swap/${formStore.leftToken?.root}`)
        }
    }

    const toggleSwapDirection = async () => {
        if (formStore.isLoading || formStore.isSwapping) {
            return
        }

        if (formStore.isMultipleSwapMode) {
            formStore.setState({
                exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
                isMultiple: false,
            })
        }

        await formStore.toggleDirection()

        updateUrl(true)
    }

    const toggleConversionDirection = async () => {
        if (formStore.isLoading || formStore.isSwapping) {
            return
        }

        await formStore.toggleConversionDirection()
    }

    const updateTokens = (leftRoot: string, rightRoot: string) => {
        const isLeftRootValid = isAddressValid(leftRoot)
        const isRightRootValid = isAddressValid(rightRoot)

        if (!isLeftRootValid && !isRightRootValid) {
            return
        }

        formStore.setData({
            leftToken: leftRoot,
            rightToken: rightRoot,
        })

        if (leftRoot === formStore.multipleSwapTokenRoot && rightRoot === formStore.multipleSwapTokenRoot) {
            formStore.setState({
                exchangeMode: SwapExchangeMode.WRAP_EVER,
                nativeCoinSide: 'leftToken',
            })
            formStore.setData('leftToken', undefined)
            history.replace('/swap')
            return
        }

        updateUrl(true)

        if (tokensCache.tokens.length > 0) {
            const leftInCache = formStore.leftToken !== undefined
            const rightInCache = formStore.rightToken !== undefined;

            (async () => {
                try {
                    if (isLeftRootValid && !leftInCache) {
                        debug('Try to fetch left token')
                        await tokensCache.addToImportQueue(leftRoot)
                    }
                }
                catch (e) {
                    error('Left token import error', e)
                    formStore.setData('leftToken', undefined)
                }

                try {
                    if (isRightRootValid && !rightInCache) {
                        debug('Try to fetch right token')
                        await tokensCache.addToImportQueue(rightRoot)
                    }
                }
                catch (e) {
                    error('Right token import error', e)
                    formStore.setData('rightToken', undefined)
                }
            })()
        }
    }

    const onKeyPress = React.useCallback(debounce(() => {
        (async () => {
            await formStore.recalculate(true)
        })()
    }, 400), [formStore.isCalculating])

    const debouncedLeftAmount = React.useCallback(debounce((value: string) => {
        formStore.forceLeftAmountUpdate(value)
    }, 400), [formStore.isCalculating])

    const debouncedRightAmount = React.useCallback(debounce((value: string) => {
        formStore.forceRightAmountUpdate(value)
    }, 400), [formStore.isCalculating])

    const onChangeLeftAmount: SwapFormShape['onChangeLeftAmount'] = value => {
        if (formStore.isConversionMode) {
            formStore.forceLeftAmountUpdate(value)
            debouncedRightAmount(value)
        }
        else {
            formStore.changeLeftAmount(value, onKeyPress)
        }
    }

    const onChangeRightAmount: SwapFormShape['onChangeRightAmount'] = value => {
        if (formStore.isConversionMode) {
            formStore.forceRightAmountUpdate(value)
            debouncedLeftAmount(value)
        }
        else {
            formStore.changeRightAmount(value, onKeyPress)
        }
    }

    const onSelectMultipleSwap = async () => {
        formStore.setState({
            exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
            isMultiple: true,
            nativeCoinSide: undefined,
        })
        if (formStore.rightToken?.root === formStore.multipleSwapTokenRoot) {
            formStore.setData('rightToken', formStore.leftToken?.root)
        }
        hideTokensList()
        await formStore.changeLeftToken(formStore.multipleSwapTokenRoot)
    }

    const onSelectLeftNativeCoin = async () => {
        hideTokensList()

        formStore.setState({
            isMultiple: false,
            nativeCoinSide: 'leftToken',
        })

        history.push({ pathname: '/swap' })

        if (formStore.rightToken?.root === formStore.multipleSwapTokenRoot) {
            formStore.setData({
                leftToken: undefined,
                rightAmount: formStore.leftAmount,
            })
            formStore.setState('exchangeMode', SwapExchangeMode.WRAP_EVER)
        }
        else {
            await formStore.changeLeftToken(formStore.multipleSwapTokenRoot)
        }
    }

    const onSelectRightNativeCoin = async () => {
        hideTokensList()

        if (formStore.isMultipleSwapMode || formStore.leftToken?.root === formStore.multipleSwapTokenRoot) {
            formStore.setData({
                rightAmount: formStore.leftAmount,
                rightToken: undefined,
            })
            formStore.setState('exchangeMode', SwapExchangeMode.UNWRAP_WEVER)
        }

        formStore.setState({
            isMultiple: false,
            nativeCoinSide: 'rightToken',
        })

        history.push({ pathname: '/swap' })
    }

    const onSelectLeftToken: SwapFormShape['onSelectLeftToken'] = async root => {
        hideTokensList()

        formStore.setState({
            exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
            isMultiple: false,
            nativeCoinSide: formStore.nativeCoinSide === 'leftToken'
                ? undefined
                : formStore.nativeCoinSide,
        })

        await formStore.changeLeftToken(root)
    }

    const onSelectRightToken: SwapFormShape['onSelectRightToken'] = async root => {
        hideTokensList()

        if (formStore.isMultipleSwapMode && root === formStore.multipleSwapTokenRoot) {
            formStore.setData({
                leftToken: undefined,
                rightToken: root,
            })
            formStore.setState({
                exchangeMode: SwapExchangeMode.WRAP_EVER,
                isMultiple: false,
                nativeCoinSide: 'leftToken',
            })
            formStore.forceRightAmountUpdate(formStore.leftAmount)
            return
        }

        if (root !== formStore.multipleSwapTokenRoot && formStore.nativeCoinSide === 'leftToken') {
            formStore.setData({
                leftToken: formStore.multipleSwapTokenRoot,
                rightToken: root,
            })
            formStore.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
            await formStore.changeRightToken(root)
            return
        }

        formStore.setState({
            exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
            nativeCoinSide: formStore.nativeCoinSide === 'rightToken'
                ? undefined
                : formStore.nativeCoinSide,
        })
        await formStore.changeRightToken(root)
    }

    const onDismissTransactionReceipt = () => {
        formStore.cleanTransactionResult()
    }

    React.useEffect(() => {
        (async () => {
            await formStore.init()
        })()

        const tokensListDisposer = reaction(
            () => tokensCache.tokens.length,
            () => {
                updateTokens(leftTokenRoot, rightTokenRoot)
            },
            { fireImmediately: true },
        )

        const tokensDisposer = reaction(
            () => [formStore.leftToken, formStore.rightToken],
            () => {
                updateUrl()
            },
            { fireImmediately: true },
        )

        return () => {
            tokensDisposer()
            tokensListDisposer()
            formStore.dispose().catch(reason => error(reason))
        }
    }, [])

    return {
        isTokenListShown,
        tokenSide,
        hideTokensList,
        showTokensList,
        toggleConversionDirection,
        toggleSwapDirection,
        onChangeLeftAmount,
        onChangeRightAmount,
        onSelectMultipleSwap,
        onSelectLeftNativeCoin,
        onSelectRightNativeCoin,
        onSelectLeftToken,
        onSelectRightToken,
        onDismissTransactionReceipt,
    }
}
