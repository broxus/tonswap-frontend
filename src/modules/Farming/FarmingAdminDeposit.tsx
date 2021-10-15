import * as React from 'react'
import { observer } from 'mobx-react-lite'

import { FarmingAdminDeposit as FarmingAdminDepositComponent } from '@/modules/Farming/components/FarmingAdminDeposit'
import { useFarmingDataStore } from '@/modules/Farming/stores/FarmingDataStore'
import { useFarmingAdminDepositStore } from '@/modules/Farming/stores/FarmingAdminDepositStore'

import './index.scss'

function FarmingAdminDepositInner(): JSX.Element {
    const farmingData = useFarmingDataStore()
    const farmingAdminDepositStore = useFarmingAdminDepositStore()

    React.useEffect(() => () => {
        farmingAdminDepositStore.dispose()
    }, [])

    return (
        <FarmingAdminDepositComponent
            formData={(farmingData.rewardTokensAddress || []).map((address, index) => ({
                tokenRoot: address,
                amount: farmingAdminDepositStore.amounts[index],
                loading: farmingAdminDepositStore.loadings[index],
                valid: farmingAdminDepositStore.amountsIsValid[index],
                userBalance: (farmingData.userRewardTokensBalance || [])[index],
                poolBalance: (farmingData.rewardTokensBalanceCumulative || [])[index],
            }))}
            showWarning={!farmingAdminDepositStore.enoughTokensBalance}
            onChange={farmingAdminDepositStore.setAmount}
            onSubmit={farmingAdminDepositStore.deposit}
        />
    )
}

export const FarmingAdminDeposit = observer(FarmingAdminDepositInner)
