import * as React from 'react'
import { observer } from 'mobx-react-lite'

import { FarmingDeposit as FarmingDepositComponent } from '@/modules/Farming/components/FarmingDeposit'
import { useFarmingDataStore } from '@/modules/Farming/stores/FarmingDataStore'
import { useFarmingDepositStore } from '@/modules/Farming/stores/FarmingDepositStore'

import './index.scss'

function FarmingDepositInner(): JSX.Element | null {
    const farmingData = useFarmingDataStore()
    const farmingDepositStore = useFarmingDepositStore()

    React.useEffect(() => () => {
        farmingDepositStore.dispose()
    }, [])

    if (!farmingData.lpTokenSymbol || !farmingData.lpTokenDecimals) {
        return null
    }

    return (
        <FarmingDepositComponent
            loading={farmingDepositStore.loading}
            walletAmount={farmingData.userLpWalletAmount}
            depositAmount={farmingDepositStore.amount}
            depositDisabled={!farmingDepositStore.amountIsValid}
            tokenSymbol={farmingData.lpTokenSymbol}
            tokenDecimals={farmingData.lpTokenDecimals}
            onChangeDeposit={farmingDepositStore.setAmount}
            onDeposit={farmingDepositStore.deposit}
        />
    )
}

export const FarmingDeposit = observer(FarmingDepositInner)
