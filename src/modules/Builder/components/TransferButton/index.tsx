import React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/common/Button'
import { useTransferForm } from '@/modules/Builder/hooks/useTransferForm'
import { TransferPopup } from '@/modules/Builder/components/TransferPopup'

function ButtonInternal(): JSX.Element {
    const intl = useIntl()
    const transferForm = useTransferForm()

    return (
        <>
            <Button type="danger" onClick={transferForm.showTransferPopup}>
                {intl.formatMessage({
                    id: 'BUILDER_MANAGE_TOKEN_TRANSFER_OWNERSHIP_BTN_TEXT',
                })}
            </Button>
            {transferForm.isTransferPopupShown && <TransferPopup onDismiss={transferForm.hideTransferPopup} />}
        </>
    )
}

export const TransferButton = observer(ButtonInternal)
