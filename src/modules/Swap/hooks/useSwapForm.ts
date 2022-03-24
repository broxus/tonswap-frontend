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

    const prepare = async (leftRoot: string, rightRoot: string) => {
        const isLeftRootValid = isAddressValid(leftRoot) || isAddressValid(formStore.leftToken?.root)
        const isRightRootValid = isAddressValid(rightRoot) || isAddressValid(formStore.rightToken?.root)
        const isLeftCoin = leftRoot === 'coin' || formStore.nativeCoinSide === 'leftToken'
        const isRightCoin = rightRoot === 'coin' || formStore.nativeCoinSide === 'rightToken'
        const isCombined = leftRoot === 'combined' || (!isLeftRootValid && !isRightRootValid && !isLeftCoin && !isRightCoin)
        const isWrap = isLeftCoin && isRightRootValid && rightRoot === formStore.multipleSwapTokenRoot
        const isUnwrap = isRightCoin && isLeftRootValid && leftRoot === formStore.multipleSwapTokenRoot

        if (isLeftRootValid && isRightRootValid && !isLeftCoin && !isRightCoin && !isCombined) {
            formStore.setState({
                isMultiple: formStore.isMultipleSwapMode,
                nativeCoinSide: undefined,
            })
            formStore.forceLeftTokenUpdate(leftRoot ?? formStore.leftToken?.root)
            formStore.forceRightTokenUpdate(rightRoot ?? formStore.rightToken?.root)
        }
        else if (isLeftCoin) {
            formStore.setState({
                isMultiple: false,
                nativeCoinSide: 'leftToken',
            })
            formStore.forceRightTokenUpdate(rightRoot ?? formStore.rightToken?.root)
            if (isWrap) {
                formStore.forceLeftTokenUpdate(undefined)
                formStore.setState('exchangeMode', SwapExchangeMode.WRAP_EVER)
            }
            else {
                formStore.forceLeftTokenUpdate(formStore.multipleSwapTokenRoot)
            }
        }
        else if (isRightCoin) {
            formStore.setState({
                isMultiple: false,
                nativeCoinSide: 'rightToken',
            })
            formStore.forceLeftTokenUpdate(leftRoot ?? formStore.leftToken?.root)
            if (isUnwrap) {
                formStore.forceRightTokenUpdate(undefined)
                formStore.setState('exchangeMode', SwapExchangeMode.UNWRAP_WEVER)
            }
            else {
                formStore.forceRightTokenUpdate(formStore.multipleSwapTokenRoot)
            }
        }
        else if (isCombined) {
            formStore.forceLeftTokenUpdate(DEFAULT_LEFT_TOKEN_ROOT)
            formStore.forceRightTokenUpdate(rightRoot ?? formStore.rightToken?.root ?? DEFAULT_RIGHT_TOKEN_ROOT)
            formStore.setState('isMultiple', true)
        }

        await formStore.changeLeftToken(formStore.leftToken?.root)

        if (tokensCache.isReady) {
            const leftInCache = tokensCache.has(leftRoot)
            const rightInCache = tokensCache.has(rightRoot)

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
        hideTokensList()

        if (formStore.isConversionMode) {
            formStore.forceRightTokenUpdate(DEFAULT_RIGHT_TOKEN_ROOT)
        }

        formStore.setState({
            exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
            isMultiple: true,
            nativeCoinSide: undefined,
        })

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

        if (formStore.rightToken?.root === formStore.multipleSwapTokenRoot) {
            formStore.forceLeftTokenUpdate(undefined)
            formStore.setState('exchangeMode', SwapExchangeMode.WRAP_EVER)
        }
        else {
            formStore.forceLeftTokenUpdate(formStore.multipleSwapTokenRoot)
        }

        const rightParam = formStore.rightToken?.root !== undefined ? `/${formStore.rightToken?.root}` : ''

        history.replace(`/swap/coin${rightParam}`)
    }

    const onSelectRightNativeCoin = async () => {
        hideTokensList()

        switch (true) {
            case formStore.isMultipleSwapMode:
                formStore.setState({
                    exchangeMode: SwapExchangeMode.UNWRAP_WEVER,
                    isMultiple: false,
                    nativeCoinSide: 'rightToken',
                })
                formStore.setData({
                    leftToken: formStore.multipleSwapTokenRoot,
                    rightToken: undefined,
                })
                break

            case formStore.isWrapMode:
                formStore.setState({
                    exchangeMode: SwapExchangeMode.UNWRAP_WEVER,
                    nativeCoinSide: 'rightToken',
                })
                formStore.setData({
                    leftToken: formStore.multipleSwapTokenRoot,
                    rightToken: undefined,
                })
                break

            default:
                formStore.setState({
                    exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
                    nativeCoinSide: 'rightToken',
                })
                formStore.setData('rightToken', formStore.multipleSwapTokenRoot)
        }

        const leftParam = formStore.leftToken?.root !== undefined ? `/${formStore.leftToken?.root}` : ''

        history.replace(`/swap${leftParam}/coin`)
    }

    const onSelectLeftToken: SwapFormShape['onSelectLeftToken'] = async root => {
        hideTokensList()

        const navigate = () => {
            let rightParam = formStore.rightToken?.root !== undefined ? `/${formStore.rightToken?.root}` : ''

            if (formStore.nativeCoinSide === 'rightToken') {
                rightParam = '/coin'
            }

            history.replace(`/swap/${root}${rightParam}`)
        }

        switch (true) {
            // from ever+wever/tip3 to tip3/tip3
            case formStore.isMultipleSwapMode:
                formStore.setState({
                    exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
                    isMultiple: false,
                    nativeCoinSide: undefined,
                })
                formStore.setData('leftToken', root)
                if (root === formStore.rightToken?.root) {
                    formStore.setData('rightToken', formStore.multipleSwapTokenRoot)
                }
                break

            // from ever/wever
            case formStore.isWrapMode:
                if (root === formStore.multipleSwapTokenRoot) { // to wever/ever
                    formStore.setState({
                        exchangeMode: SwapExchangeMode.UNWRAP_WEVER,
                        nativeCoinSide: 'rightToken',
                    })
                    formStore.setData({
                        leftToken: root,
                        rightToken: undefined,
                    })
                }
                else { // to tip3/tip3
                    formStore.setState({
                        exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
                        nativeCoinSide: undefined,
                    })
                    formStore.setData('leftToken', root)
                }
                break

            // from wever/ever to tip3/tip3
            case formStore.isUnwrapMode:
                formStore.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
                formStore.setData({
                    leftToken: root,
                    rightToken: formStore.multipleSwapTokenRoot,
                })
                break

            // from ever/tip3 to tip3/tip3
            case formStore.nativeCoinSide === 'leftToken':
                if (root === formStore.rightToken?.root) {
                    formStore.setState({
                        exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
                        nativeCoinSide: 'rightToken',
                    })
                    formStore.setData({
                        leftToken: root,
                        rightToken: formStore.multipleSwapTokenRoot,
                    })
                }
                else {
                    formStore.setState({
                        exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
                        nativeCoinSide: undefined,
                    })
                    formStore.setData('leftToken', root)
                }
                break

            // from tip3/ever
            case formStore.nativeCoinSide === 'rightToken':
                if (root === formStore.multipleSwapTokenRoot) { // to wever/ever
                    formStore.setState('exchangeMode', SwapExchangeMode.UNWRAP_WEVER)
                    formStore.setData('rightToken', undefined)
                }
                else { // to tip3/tip3
                    formStore.setData('rightToken', formStore.multipleSwapTokenRoot)
                }
                formStore.setData('leftToken', root)
                break

            default:
        }

        await formStore.changeLeftToken(root)

        navigate()
    }

    const onSelectRightToken: SwapFormShape['onSelectRightToken'] = async root => {
        hideTokensList()

        const navigate = () => {
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

        switch (true) {
            // from ever+wever/tip3
            case formStore.isMultipleSwapMode:
                if (root === formStore.multipleSwapTokenRoot) { // to ever/wever
                    formStore.setState({
                        exchangeMode: SwapExchangeMode.WRAP_EVER,
                        isMultiple: false,
                        nativeCoinSide: 'leftToken',
                    })
                    formStore.setData({
                        leftToken: undefined,
                        rightToken: root,
                    })
                    // formStore.forceRightAmountUpdate(formStore.leftAmount)
                }
                else { // to new tip3
                    formStore.setData('rightToken', root)
                }
                break

            // from ever/wever to tip3/tip3
            case formStore.isWrapMode:
                formStore.setState('exchangeMode', SwapExchangeMode.DIRECT_EXCHANGE)
                formStore.setData({
                    leftToken: formStore.multipleSwapTokenRoot,
                    rightToken: root,
                })
                break

            // from wever/ever
            case formStore.isUnwrapMode:
                if (root === formStore.multipleSwapTokenRoot) { // to ever/wever
                    formStore.setState({
                        exchangeMode: SwapExchangeMode.WRAP_EVER,
                        nativeCoinSide: 'leftToken',
                    })
                    formStore.setData({
                        leftToken: undefined,
                        rightToken: root,
                    })
                }
                else { // to tip3/tip3
                    formStore.setState({
                        exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
                        nativeCoinSide: undefined,
                    })
                    formStore.setData('rightToken', root)
                }
                break

            // from ever/tip3
            case formStore.nativeCoinSide === 'leftToken':
                if (root === formStore.multipleSwapTokenRoot) { // to ever/wever
                    formStore.setState('exchangeMode', SwapExchangeMode.WRAP_EVER)
                    formStore.setData('leftToken', undefined)
                }
                else { // to tip3/tip3
                    formStore.setData('leftToken', formStore.multipleSwapTokenRoot)
                }
                formStore.setData('rightToken', root)
                break

            // from tip3/ever to tip3/tip3
            case formStore.nativeCoinSide === 'rightToken':
                if (root === formStore.leftToken?.root) {
                    formStore.setState({
                        exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
                        nativeCoinSide: 'leftToken',
                    })
                    formStore.setData({
                        leftToken: formStore.multipleSwapTokenRoot,
                        rightToken: root,
                    })
                }
                else {
                    formStore.setState({
                        exchangeMode: SwapExchangeMode.DIRECT_EXCHANGE,
                        nativeCoinSide: undefined,
                    })
                    formStore.setData('rightToken', root)
                }
                break

            default:
        }

        await formStore.changeRightToken(root)

        navigate()
    }

    const onDismissTransactionReceipt = () => {
        formStore.cleanTransactionResult()
    }

    React.useEffect(() => {
        const tokensListDisposer = reaction(
            () => tokensCache.isReady,
            async isReady => {
                if (isReady) {
                    await prepare(leftTokenRoot, rightTokenRoot)
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
