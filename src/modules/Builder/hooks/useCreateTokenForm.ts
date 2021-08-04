import * as React from 'react'

import { CreateTokenStoreData } from '@/modules/Builder/types'
import { useCreateTokenStore } from '@/modules/Builder/stores/CreateTokenStore'


type CreateTokenFormShape = {
    onChangeData: <K extends keyof CreateTokenStoreData>(key: K) => (value: CreateTokenStoreData[K]) => void;
    onDismissTransactionReceipt: () => void
}


export function useCreateTokenForm(): CreateTokenFormShape {
    const creatingToken = useCreateTokenStore()

    const onChangeData = <K extends keyof CreateTokenStoreData>(key: K) => (value: CreateTokenStoreData[K]) => {
        creatingToken.changeData(key, value)
    }

    const onDismissTransactionReceipt = () => {
        creatingToken.cleanTransactionResult()
    }

    React.useEffect(() => {
        creatingToken.init()
        return () => {
            creatingToken.dispose()
        }
    })

    return {
        onChangeData,
        onDismissTransactionReceipt,
    }
}
