import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'

import { useBurnForm } from '@/modules/Builder/hooks/useBurnForm'
import { BuilderField } from '@/modules/Builder/components/BuilderField'
import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { isAddressValid } from '@/misc'


function Field(): JSX.Element {
    const intl = useIntl()
    const { tokenRoot } = useParams<{ tokenRoot: string }>()
    const managingToken = useManageTokenStore(tokenRoot)
    const burnForm = useBurnForm()

    const handleChange = (targetAddress: string): void => {
        burnForm.onChangeData('targetAddress')(targetAddress)
        burnForm.debouncedLoadTargetWalletBalance()
    }

    return (
        <BuilderField
            disabled={managingToken.isBurning}
            label={intl.formatMessage({
                id: 'BUILDER_MANAGE_TOKEN_LABEL_TARGET_ADDRESS',
            })}
            isValid={isAddressValid(managingToken.targetAddress)}
            value={managingToken.targetAddress}
            onChange={handleChange}
        />
    )
}

export const BurnAddressField = observer(Field)
