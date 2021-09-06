import * as React from 'react'
import { useParams } from 'react-router-dom'

import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { ManageTokenStoreData } from '@/modules/Builder/types'
import { debounce } from '@/utils'

type MintFormShape = {
    isMintPopupShown: boolean;
    showMintPopup: () => void;
    hideMintPopup: () => void;
    onChangeData: <K extends keyof Pick<ManageTokenStoreData, 'targetAddress' | 'targetWalletBalance' | 'amountToMint'>>
        (key: K) => (value: ManageTokenStoreData[K]) => void;
    debouncedLoadTargetWalletBalance: () => void;

}

export function useMintForm(): MintFormShape {
    const { tokenRoot } = useParams<{ tokenRoot: string }>()
    const managingToken = useManageTokenStore(tokenRoot)

    const [isMintPopupShown, setIsMintPopupShown] = React.useState(false)

    const showMintPopup = () => {
        setIsMintPopupShown(true)
    }

    const hideMintPopup = () => {
        setIsMintPopupShown(false)
    }

    const onChangeData = <K extends keyof Pick<ManageTokenStoreData, 'targetAddress' | 'targetWalletBalance' | 'amountToMint'>>
        (key: K) => (value: ManageTokenStoreData[K]) => {
            managingToken.changeData(key, value)
        }

    const debouncedLoadTargetWalletBalance = debounce(async () => {
        await managingToken.loadTargetWalletBalance()
    }, 500)

    return {
        isMintPopupShown,
        showMintPopup,
        hideMintPopup,
        onChangeData,
        debouncedLoadTargetWalletBalance,
    }
}
