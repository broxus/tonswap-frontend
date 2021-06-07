import * as React from 'react'

import {
    PropertyKey,
    SwapData,
    useSwap,
} from '@/modules/Swap/stores/SwapStore'
import { TokenCache } from '@/stores/TokensCacheService'


export type TokenSide = 'leftToken' | 'rightToken'

type SwapFormShape = {
    isTokenListShown: boolean;
    tokenSide: TokenSide | null;
    hideTokensList(): void;
    showTokensList(side: TokenSide): () => void;
    onChangeData<K extends PropertyKey<SwapData>>(key: K): (value: SwapData[K]) => void;
    onSelectToken(token: TokenCache): void;
    onCloseTransactionReceipt(): void;
}


export function useSwapForm(): SwapFormShape {
    const swap = useSwap()

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

    const onChangeData = <K extends PropertyKey<SwapData>>(key: K) => (value: SwapData[K]) => {
        swap.changeData(key, value)
    }

    const onSelectToken = (token: TokenCache) => {
        if (tokenSide) {
            swap.changeData(tokenSide, token)
            hideTokensList()
        }
    }

    const onCloseTransactionReceipt = () => {
        swap.cleanTransactionResult()
    }

    React.useEffect(() => {
        swap.start()
        return () => {
            swap.dispose()
        }
    }, [])

    return {
        isTokenListShown,
        tokenSide,
        hideTokensList,
        showTokensList,
        onChangeData,
        onSelectToken,
        onCloseTransactionReceipt,
    }
}
