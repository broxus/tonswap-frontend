import React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { BurnPopup } from '@/modules/Builder/components/BurnPopup'
import { useBurnForm } from '@/modules/Builder/hooks/useBurnForm'


function ButtonInternal(): JSX.Element {
    const intl = useIntl()
    const burnForm = useBurnForm()

    return (
        <>
            <Button
                type="primary"
                onClick={burnForm.showBurnPopup}
            >
                {intl.formatMessage({
                    id: 'BUILDER_MANAGE_TOKEN_BURN_BTN_TEXT',
                })}
            </Button>
            {burnForm.isBurnPopupShown && <BurnPopup onDismiss={burnForm.hideBurnPopup} />}
        </>
    )
}

export const BurnButton = observer(ButtonInternal)
