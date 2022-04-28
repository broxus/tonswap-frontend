import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { isAddressValid } from '@/misc'
import { BuilderField } from '@/modules/Builder/components/BuilderField'
import { TransferSubmitButton } from '@/modules/Builder/components/TransferSubmitButton'
import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { useTransferForm } from '@/modules/Builder/hooks/useTransferForm'

import './index.scss'

type Props = {
    onDismiss: () => void;
}


function Popup({ onDismiss }: Props): JSX.Element {
    const { rootToken } = useParams<{ rootToken: string }>()

    const intl = useIntl()
    const managingToken = useManageTokenStore(rootToken)
    const transferForm = useTransferForm()

    return ReactDOM.createPortal(
        <div className="manage-token transfer-popup popup">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <Button
                    className="popup-close"
                    type="icon"
                    onClick={onDismiss}
                >
                    <Icon icon="close" />
                </Button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'BUILDER_MANAGE_TOKEN_TRANSFER_POPUP_TITLE',
                    })}
                </h2>
                <div className="card-block card-block--alert warning-block">
                    <p className="text text--bold">⚠️ Warning</p>
                    <p className="text">This action is irreversible!</p>
                    <p className="text">Please double check the target address before confirming the transfer.</p>
                </div>
                <div className="form-builder">
                    <BuilderField
                        disabled={managingToken.isTransfer}
                        label={intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_TRANSFER_LABEL_NEW_OWNER' })}
                        type="string"
                        isValid={
                            isAddressValid(managingToken.newOwnerAddress, true)
                        }
                        value={managingToken.newOwnerAddress}
                        onChange={transferForm.onChangeData('newOwnerAddress')}
                    />
                </div>
                <div className="popup-actions">
                    <Button
                        block
                        className="form-submit"
                        size="lg"
                        type="tertiary"
                        onClick={onDismiss}
                    >
                        {intl.formatMessage({
                            id: 'BUILDER_MANAGE_TOKEN_BTN_TEXT_CANCEL',
                        })}
                    </Button>
                    <TransferSubmitButton closePopup={onDismiss} />
                </div>
            </div>
        </div>,
        document.body,
    )
}

export const TransferPopup = observer(Popup)
