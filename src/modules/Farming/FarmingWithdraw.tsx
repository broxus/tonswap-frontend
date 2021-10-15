import * as React from 'react'
import { observer } from 'mobx-react-lite'

import { FarmingWithdraw as FarmingWithdrawComponent } from '@/modules/Farming/components/FarmingWithdraw'
import { useFarmingDataStore } from '@/modules/Farming/stores/FarmingDataStore'
import { useFarmingClaimStore } from '@/modules/Farming/stores/FarmingClaimStore'
import { useFarmingWithdrawStore } from '@/modules/Farming/stores/FarmingWithdrawStore'

import './index.scss'

function FarmingWithdrawInner(): JSX.Element | null {
    const farmingData = useFarmingDataStore()
    const farmingClaimStore = useFarmingClaimStore()
    const farmingWithdrawStore = useFarmingWithdrawStore()

    React.useEffect(() => () => {
        farmingWithdrawStore.dispose()
        farmingClaimStore.dispose()
    }, [])

    if (
        !farmingData.lpTokenSymbol
        || !farmingData.rewardTokensAddress
        || !farmingData.userPendingRewardVested
        || !farmingData.lpTokenDecimals
    ) {
        return null
    }

    return (
        <FarmingWithdrawComponent
            loading={farmingWithdrawStore.loading || farmingClaimStore.loading}
            farmingAmount={farmingData.userLpFarmingAmount}
            withdrawAmount={farmingWithdrawStore.amount}
            withdrawDisabled={!farmingWithdrawStore.amountIsValid}
            claimDisabled={!farmingClaimStore.claimIsAvailable}
            tokenSymbol={farmingData.lpTokenSymbol}
            tokenDecimals={farmingData.lpTokenDecimals}
            rewardTokenRoots={farmingData.rewardTokensAddress}
            rewardAmounts={farmingData.userPendingRewardVested}
            onChangeWithdraw={farmingWithdrawStore.setAmount}
            onWithdraw={farmingWithdrawStore.withdraw}
            onClaim={farmingClaimStore.claim}
        />
    )
}

export const FarmingWithdraw = observer(FarmingWithdrawInner)
