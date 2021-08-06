import * as React from 'react'
import { reaction } from 'mobx'
import { useHistory, useParams } from 'react-router-dom'

import { DEFAULT_LEFT_TOKEN_ROOT, DEFAULT_RIGHT_TOKEN_ROOT } from '@/modules/Swap/constants'
import { useSwapStore } from '@/modules/Swap/stores/SwapStore'
import { SwapStoreData } from '@/modules/Swap/types'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
import { error } from '@/utils'


type TokenSide = 'leftToken' | 'rightToken'

type SwapFormShape = {
    isTokenListShown: boolean;
    tokenSide: TokenSide | null;
    hideTokensList: () => void;
    showTokensList: (side: TokenSide) => () => void;
    toggleTokensDirection: () => void;
    onChangeData: <K extends keyof SwapStoreData>(key: K) => (value: SwapStoreData[K]) => void;
    onSelectToken: (token: TokenCache) => void;
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

    const toggleTokensDirection = () => {
        if (swap.isLoading || swap.isSwapping) {
            return
        }
        swap.toggleTokensDirection()

        if (swap.leftToken?.root !== undefined && swap.rightToken?.root !== undefined) {
            history.replace(`/swap/${swap.leftToken?.root}/${swap.rightToken?.root}`)
        }
        else if (swap.leftToken?.root !== undefined && swap.rightToken?.root === undefined) {
            history.replace(`/swap/${swap.leftToken?.root}`)
        }
    }

    const onChangeData = <K extends keyof SwapStoreData>(key: K) => (value: SwapStoreData[K]) => {
        swap.changeData(key, value)
    }

    const onSelectToken = (token: TokenCache) => {
        let pathname = '/swap'
        if (tokenSide === 'leftToken') {
            const rightTokenRoot = (swap.rightToken?.root !== undefined && swap.rightToken.root !== token.root)
                ? `/${swap.rightToken.root}`
                : ''
            pathname += `/${token.root}${rightTokenRoot}`
        }
        else if (
            tokenSide === 'rightToken'
            && swap.leftToken?.root !== undefined
            && swap.leftToken.root !== token.root
        ) {
            pathname += `/${swap.leftToken.root}/${token.root}`
        }
        else if (tokenSide) {
            swap.changeData(tokenSide, token)
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
            if (!swap.leftToken || swap.leftToken.root !== leftTokenAddress) {
                swap.changeData('leftToken', tokensCache.get(leftTokenAddress))
            }

            if (!swap.rightToken || swap.rightToken.root !== rightTokenAddress) {
                swap.changeData('rightToken', tokensCache.get(rightTokenAddress))
            }

            if (
                leftTokenAddress === undefined
                && swap.leftToken === undefined
                && rightTokenAddress === undefined
                && swap.rightToken === undefined
            ) {
                swap.changeData('leftToken', tokensCache.get(DEFAULT_LEFT_TOKEN_ROOT))
                swap.changeData('rightToken', tokensCache.get(DEFAULT_RIGHT_TOKEN_ROOT))
            }
        })

        return () => {
            swap.dispose().catch(reason => error(reason))
            tokensListDisposer()
        }
    }, [])

    React.useEffect(() => {
        if (leftTokenAddress !== undefined && tokensCache.get(leftTokenAddress) !== undefined) {
            swap.changeData('leftToken', tokensCache.get(leftTokenAddress))
        }

        if (rightTokenAddress !== undefined && tokensCache.get(rightTokenAddress) !== undefined) {
            swap.changeData('rightToken', tokensCache.get(rightTokenAddress))
        }

        if (leftTokenAddress !== undefined && rightTokenAddress === undefined) {
            swap.changeData('rightToken', undefined)
        }

        if (
            leftTokenAddress === undefined
            && swap.leftToken === undefined
            && rightTokenAddress === undefined
            && swap.rightToken === undefined
        ) {
            swap.changeData('leftToken', tokensCache.get(DEFAULT_LEFT_TOKEN_ROOT))
            swap.changeData('rightToken', tokensCache.get(DEFAULT_RIGHT_TOKEN_ROOT))
        }
    }, [leftTokenAddress, rightTokenAddress])

    return {
        isTokenListShown,
        tokenSide,
        hideTokensList,
        showTokensList,
        toggleTokensDirection,
        onChangeData,
        onSelectToken,
        onDismissTransactionReceipt,
    }
}
