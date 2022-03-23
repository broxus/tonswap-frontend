import * as React from 'react'
import { reaction } from 'mobx'
import { useHistory, useParams } from 'react-router-dom'

import { isAddressValid } from '@/misc'
import { DEFAULT_LEFT_TOKEN_ROOT, DEFAULT_RIGHT_TOKEN_ROOT } from '@/modules/Swap/constants'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import type { BaseSwapStoreData } from '@/modules/Swap/types'
import { SwapExchangeMode } from '@/modules/Swap/types'
import type { TokenSide } from '@/modules/TokensList'
import { debounce, debug, error } from '@/utils'


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

    const updateTokens = async (leftRoot: string, rightRoot: string) => {
        const isLeftRootValid = isAddressValid(leftRoot)
        const isRightRootValid = isAddressValid(rightRoot)
        const isLeftCoin = leftRoot === 'coin'
        const isRightCoin = rightRoot === 'coin'
        const isCombined = leftRoot === 'combined' || (!isLeftRootValid && !isRightRootValid && !isLeftCoin && !isRightCoin)
        const isWrap = isLeftCoin && isRightRootValid && rightRoot === formStore.multipleSwapTokenRoot
        const isUnwrap = isRightCoin && isLeftRootValid && leftRoot === formStore.multipleSwapTokenRoot

        if (isLeftRootValid && isRightRootValid) {
            formStore.setState({
                isMultiple: false,
                nativeCoinSide: undefined,
            })
            formStore.forceLeftTokenUpdate(leftRoot)
            formStore.forceRightTokenUpdate(rightRoot)
        }
        else if (isLeftCoin) {
            formStore.setState({
                isMultiple: false,
                nativeCoinSide: 'leftToken',
            })
            formStore.forceLeftTokenUpdate(formStore.multipleSwapTokenRoot)
            formStore.forceRightTokenUpdate(rightRoot)
            if (isWrap) {
                formStore.setState('exchangeMode', SwapExchangeMode.WRAP_EVER)
            }
        }
        else if (isRightCoin) {
            formStore.setState({
                isMultiple: false,
                nativeCoinSide: 'rightToken',
            })
            formStore.forceLeftTokenUpdate(leftRoot)
            formStore.forceRightTokenUpdate(formStore.multipleSwapTokenRoot)
            if (isUnwrap) {
                formStore.setState('exchangeMode', SwapExchangeMode.UNWRAP_WEVER)
            }
        }
        else if (isCombined) {
            formStore.forceLeftTokenUpdate(DEFAULT_LEFT_TOKEN_ROOT)
            formStore.forceRightTokenUpdate(rightRoot ?? formStore.rightToken?.root ?? DEFAULT_RIGHT_TOKEN_ROOT)
            formStore.setState('isMultiple', true)
        }

        if (formStore.leftToken?.root === undefined && formStore.rightToken?.root === undefined) {
            formStore.forceRightTokenUpdate(DEFAULT_RIGHT_TOKEN_ROOT)
            formStore.setState('isMultiple', true)
            await formStore.changeLeftToken(DEFAULT_LEFT_TOKEN_ROOT)
            return
        }

        await formStore.changeLeftToken(formStore.leftToken?.root)

        if (tokensCache.isReady) {
            const leftInCache = formStore.leftToken !== undefined
            const rightInCache = formStore.rightToken !== undefined

            try {
                if (isLeftRootValid && !leftInCache && !isLeftCoin) {
                    debug('Try to fetch left token')
                    await tokensCache.addToImportQueue(leftRoot)
                }
            }
            catch (e) {
                error('Left token import error', e)
                formStore.forceLeftTokenUpdate(undefined)
            }

            try {
                if (isRightRootValid && !rightInCache && !isRightCoin) {
                    debug('Try to fetch right token')
                    await tokensCache.addToImportQueue(rightRoot)
                }
            }
            catch (e) {
                error('Right token import error', e)
                formStore.forceRightTokenUpdate(undefined)
            }
        }
    }

    const toggleSwapDirection = async () => {
        if (formStore.isLoading || formStore.isSwapping) {
            return
        }

        await formStore.toggleDirection()

        let leftParam = formStore.leftToken?.root ?? '',
            rightParam = formStore.rightToken?.root ?? ''

        if (formStore.nativeCoinSide === 'rightToken') {
            rightParam = 'coin'
        }
        else if (formStore.nativeCoinSide === 'leftToken') {
            leftParam = 'coin'
        }

        if (formStore.isMultipleSwapMode) {
            formStore.setState({
                exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
                isMultiple: false,
            })
        }

        const params = [leftParam, rightParam].filter(Boolean)
        const hasParams = params.length > 0

        history.replace(`/swap${hasParams ? `/${params.join('/')}` : ''}`)
    }

    const toggleConversionDirection = async () => {
        if (formStore.isLoading || formStore.isSwapping) {
            return
        }

        await formStore.toggleConversionDirection()

        const leftParam = formStore.isWrapMode ? 'coin' : formStore.multipleSwapTokenRoot
        const rightParam = formStore.isWrapMode ? formStore.multipleSwapTokenRoot : 'coin'

        const params = [leftParam, rightParam].filter(Boolean)
        const hasParams = params.length > 0

        history.replace(`/swap${hasParams ? `/${params.join('/')}` : ''}`)
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
            formStore.forceRightTokenUpdate(formStore.leftToken?.root)
        }

        hideTokensList()

        await formStore.changeLeftToken(formStore.multipleSwapTokenRoot)

        const rightParam = formStore.rightToken?.root !== undefined ? `/${formStore.rightToken?.root}` : ''

        history.replace(`/swap/combined${rightParam}`)
    }

    const onSelectLeftNativeCoin = async () => {
        hideTokensList()

        formStore.setState({
            isMultiple: false,
            nativeCoinSide: 'leftToken',
        })

        // formStore.forceLeftTokenUpdate(formStore.rightToken?.root)
        formStore.setState('nativeCoinSide', 'leftToken')

        if (formStore.rightToken?.root === formStore.multipleSwapTokenRoot) {
            formStore.setState('exchangeMode', SwapExchangeMode.WRAP_EVER)
        }

        const rightParam = formStore.rightToken?.root !== undefined ? `/${formStore.rightToken?.root}` : ''

        history.replace(`/swap/coin${rightParam}`)
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

        const leftParam = formStore.leftToken?.root !== undefined ? `/${formStore.leftToken?.root}` : ''

        history.replace(`/swap${leftParam}/coin`)
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

        let rightParam = formStore.rightToken?.root !== undefined ? `/${formStore.rightToken?.root}` : ''

        if (formStore.nativeCoinSide === 'rightToken') {
            rightParam = '/coin'
        }

        history.replace(`/swap/${root}${rightParam}`)
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

        let leftParam = formStore.leftToken?.root !== undefined ? `/${formStore.leftToken?.root}` : undefined

        if (formStore.nativeCoinSide === 'leftToken') {
            leftParam = '/coin'
        }

        if (formStore.isMultipleSwapMode) {
            leftParam = '/combined'
        }

        if (leftParam !== undefined) {
            history.replace(`/swap${leftParam}/${root}`)
        }
    }

    const onDismissTransactionReceipt = () => {
        formStore.cleanTransactionResult()
    }

    React.useEffect(() => {
        const tokensListDisposer = reaction(
            () => tokensCache.isReady,
            async isReady => {
                if (isReady) {
                    await updateTokens(leftTokenRoot, rightTokenRoot)
                }
            },
            { fireImmediately: true },
        );

        (async () => {
            await formStore.init()
        })()

        return () => {
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
