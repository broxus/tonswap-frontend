import React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { BurnPopup } from '@/modules/Builder/components/BurnPopup'
import { useBurnForm } from '@/modules/Builder/hooks/useBurnForm'


function Button(): JSX.Element {
    const intl = useIntl()
    const burnForm = useBurnForm()

    return (
        <>
            <button className="btn btn-primary" type="button" onClick={burnForm.showBurnPopup}>
                {intl.formatMessage({
                    id: 'BUILDER_MANAGE_TOKEN_BURN_BTN_TEXT',
                })}
            </button>
            {burnForm.isBurnPopupShown && <BurnPopup onDismiss={burnForm.hideBurnPopup} />}
        </>
    )
}

export const BurnButton = observer(Button)
