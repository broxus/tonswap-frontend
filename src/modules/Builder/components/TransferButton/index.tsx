import React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { useTransferForm } from '@/modules/Builder/hooks/useTransferForm'
import { TransferPopup } from '@/modules/Builder/components/TransferPopup'

function Button(): JSX.Element {
    const intl = useIntl()
    const transferForm = useTransferForm()

    return (
        <>
            <button className="btn btn-danger" type="button" onClick={transferForm.showTransferPopup}>
                {intl.formatMessage({
                    id: 'BUILDER_MANAGE_TOKEN_TRANSFER_OWNERSHIP_BTN_TEXT',
                })}
            </button>
            {transferForm.isTransferPopupShown && <TransferPopup onDismiss={transferForm.hideTransferPopup} />}
        </>
    )
}

export const TransferButton = observer(Button)
