import * as React from 'react'
import { useParams } from 'react-router-dom'

import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { ManageTokenStoreData } from '@/modules/Builder/types'

type MintFormShape = {
    isTransferPopupShown: boolean;
    showTransferPopup: () => void;
    hideTransferPopup: () => void;
    onChangeData: <K extends keyof Pick<ManageTokenStoreData, 'newOwnerAddress'>>
        (key: K) => (value: ManageTokenStoreData[K]) => void;

}

export function useTransferForm(): MintFormShape {
    const { tokenRoot } = useParams<{ tokenRoot: string }>()
    const managingToken = useManageTokenStore(tokenRoot)

    const [isTransferPopupShown, setIsTransferPopupShown] = React.useState(false)

    const showTransferPopup = () => {
        setIsTransferPopupShown(true)
    }

    const hideTransferPopup = () => {
        setIsTransferPopupShown(false)
    }

    const onChangeData = <K extends keyof Pick<ManageTokenStoreData, 'newOwnerAddress'>>(key: K) => (value: ManageTokenStoreData[K]) => {
        managingToken.changeData(key, value)
    }

    return {
        isTransferPopupShown,
        showTransferPopup,
        hideTransferPopup,
        onChangeData,
    }
}
