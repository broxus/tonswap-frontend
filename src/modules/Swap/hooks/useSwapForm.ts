import * as React from 'react'

import { useSwap } from '@/modules/Swap/stores/SwapStore'
import { SwapStoreData, SwapStoreDataProp } from '@/modules/Swap/types'
import { TokenCache } from '@/stores/TokensCacheService'
import { error } from '@/utils'


type TokenSide = SwapStoreDataProp.LEFT_TOKEN | SwapStoreDataProp.RIGHT_TOKEN

type SwapFormShape = {
    isTokenListShown: boolean;
    tokenSide: TokenSide | null;
    hideTokensList: () => void;
    showTokensList: (side: TokenSide) => () => void;
    onChangeData: <K extends keyof SwapStoreData>(key: K) => (value: SwapStoreData[K]) => void;
    onSelectToken: (token: TokenCache) => void;
    onDismissTransactionReceipt: () => void;
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

    const onChangeData = <K extends keyof SwapStoreData>(key: K) => (value: SwapStoreData[K]) => {
        swap.changeData(key, value)
    }

    const onSelectToken = (token: TokenCache) => {
        if (tokenSide) {
            swap.changeData(tokenSide, token)
            hideTokensList()
        }
    }

    const onDismissTransactionReceipt = () => {
        swap.cleanTransactionResult()
    }

    React.useEffect(() => {
        (async () => {
            await swap.init()
        })()
        return () => {
            swap.dispose().catch(err => error(err))
        }
    }, [])

    return {
        isTokenListShown,
        tokenSide,
        hideTokensList,
        showTokensList,
        onChangeData,
        onSelectToken,
        onDismissTransactionReceipt,
    }
}
