import * as React from 'react'
import { useParams } from 'react-router-dom'

import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { ManageTokenStoreData } from '@/modules/Builder/types'
import { debounce } from '@/utils'

type BurnFormShape = {
    isBurnPopupShown: boolean;
    showBurnPopup: () => void;
    hideBurnPopup: () => void;
    onChangeData: <K extends keyof Pick<ManageTokenStoreData, 'targetAddress' | 'amountToBurn' | 'callbackAddress' | 'callbackPayload'>>
    (key: K) => (value: ManageTokenStoreData[K]) => void;
    debouncedLoadTargetWalletBalance: () => void;

}

export function useBurnForm(): BurnFormShape {
    const { tokenRoot } = useParams<{ tokenRoot: string }>()
    const managingToken = useManageTokenStore(tokenRoot)

    const [isBurnPopupShown, setIsBurnPopupShown] = React.useState(false)

    const showBurnPopup = () => {
        setIsBurnPopupShown(true)
    }

    const hideBurnPopup = () => {
        setIsBurnPopupShown(false)
    }

    const onChangeData = <K extends keyof Pick<ManageTokenStoreData, 'targetAddress' | 'amountToBurn' | 'callbackAddress' | 'callbackPayload'>>
        (key: K) => (value: ManageTokenStoreData[K]) => {
            managingToken.changeData(key, value)
        }

    const debouncedLoadTargetWalletBalance = debounce(async () => {
        await managingToken.loadTargetWalletBalance()
    }, 500)

    return {
        isBurnPopupShown,
        showBurnPopup,
        hideBurnPopup,
        onChangeData,
        debouncedLoadTargetWalletBalance,
    }
}
