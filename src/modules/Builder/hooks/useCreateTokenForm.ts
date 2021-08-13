import * as React from 'react'
import { useHistory } from 'react-router-dom'

import { useCreateTokenStore } from '@/modules/Builder/stores/CreateTokenStore'
import { CreateTokenStoreData } from '@/modules/Builder/types'


type CreateTokenFormShape = {
    onChangeData: <K extends keyof CreateTokenStoreData>(key: K) => (value: CreateTokenStoreData[K]) => void;
    onDismissTransactionReceipt: () => void
}


export function useCreateTokenForm(): CreateTokenFormShape {
    const history = useHistory()
    const creatingToken = useCreateTokenStore()


    const onChangeData = <K extends keyof CreateTokenStoreData>(key: K) => (value: CreateTokenStoreData[K]) => {
        creatingToken.changeData(key, value)
    }

    const onDismissTransactionReceipt = () => {
        if (creatingToken.transaction?.success) {
            history.push('/builder')
        }

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
