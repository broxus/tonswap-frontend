import * as React from 'react'
import { reaction } from 'mobx'
import { useHistory, useParams } from 'react-router-dom'

import { DEFAULT_LEFT_TOKEN_ROOT, DEFAULT_RIGHT_TOKEN_ROOT } from '@/modules/Swap/constants'
import { useSwapStore } from '@/modules/Swap/stores/SwapStore'
import { SwapDirection, SwapStoreData } from '@/modules/Swap/types'
import { useTokensCache } from '@/stores/TokensCacheService'
import { debounce, error } from '@/utils'


type TokenSide = keyof Pick<SwapStoreData, 'leftToken' | 'rightToken'>

type SwapFormShape = {
    isTokenListShown: boolean;
    tokenSide: TokenSide | null;
    hideTokensList: () => void;
    showTokensList: (side: TokenSide) => () => void;
    toggleTokensDirection: () => void;
    onChangeLeftAmount: (value: SwapStoreData['leftAmount']) => void;
    onChangeRightAmount: (value: SwapStoreData['rightAmount']) => void;
    onKeyUp: () => void;
    onSelectToken: (root: string) => void;
    onDismissTransactionReceipt: () => void;
}


export function useSwapForm(): SwapFormShape {
    const swap = useSwapStore()
    const {
        leftTokenAddress,
        rightTokenAddress,
    } = useParams<{
        leftTokenAddress: string,
        rightTokenAddress: string,
    }>()
    const history = useHistory()
    const tokensCache = useTokensCache()

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

    const onChangeLeftAmount: SwapFormShape['onChangeLeftAmount'] = value => {
        if (swap.direction === SwapDirection.RTL) {
            swap.changeState('direction', SwapDirection.LTR)
        }

        swap.changeData('leftAmount', value)

        if (value.length === 0) {
            swap.changeData('rightAmount', '')
        }
    }

    const onChangeRightAmount: SwapFormShape['onChangeRightAmount'] = value => {
        if (swap.direction === SwapDirection.LTR) {
            swap.changeState('direction', SwapDirection.RTL)
        }

        swap.changeData('rightAmount', value)

        if (value.length === 0) {
            swap.changeData('leftAmount', '')
        }
    }

    const onKeyUp: SwapFormShape['onKeyUp'] = debounce(event => {
        console.log(event);
        (async () => {
            await swap.recalculate(!swap.isCalculating)
        })()
    }, 400)

    const onSelectToken: SwapFormShape['onSelectToken'] = root => {
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
        history.push({ pathname })
        hideTokensList()
    }

    const onDismissTransactionReceipt = () => {
        swap.cleanTransactionResult()
    }

    React.useEffect(() => {
        (async () => {
            await swap.init()
        })()

        // Initial update tokens state by the given uri params and after list of the tokens loaded
        const tokensListDisposer = reaction(() => tokensCache.tokens, () => {
            if (
                (swap.leftToken === undefined || swap.leftToken.root !== leftTokenAddress)
                && tokensCache.has(leftTokenAddress)
            ) {
                swap.changeData('leftToken', leftTokenAddress)
            }

            if (
                (swap.rightToken === undefined || swap.rightToken.root !== rightTokenAddress)
                && tokensCache.has(rightTokenAddress)
            ) {
                swap.changeData('rightToken', rightTokenAddress)
            }

            if (
                leftTokenAddress === undefined
                && swap.leftToken === undefined
                && tokensCache.has(DEFAULT_LEFT_TOKEN_ROOT)
            ) {
                swap.changeData('leftToken', DEFAULT_LEFT_TOKEN_ROOT)
            }

            if (
                rightTokenAddress === undefined
                && swap.rightToken === undefined
                && tokensCache.has(DEFAULT_RIGHT_TOKEN_ROOT)
            ) {
                swap.changeData('rightToken', DEFAULT_RIGHT_TOKEN_ROOT)
            }
        })

        return () => {
            swap.dispose().catch(reason => error(reason))
            tokensListDisposer()
        }
    }, [])

    return {
        isTokenListShown,
        tokenSide,
        hideTokensList,
        showTokensList,
        toggleTokensDirection,
        onChangeLeftAmount,
        onChangeRightAmount,
        onKeyUp,
        onSelectToken,
        onDismissTransactionReceipt,
    }
}
