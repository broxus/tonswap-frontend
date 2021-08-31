import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Icon } from '@/components/common/Icon'
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
        <div className="transfer-popup popup">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <button
                    type="button"
                    className="btn popup-close btn-icon"
                    onClick={onDismiss}
                >
                    <Icon icon="close" />
                </button>
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
                <BuilderField
                    disabled={managingToken.isTransfer}
                    label={intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_TRANSFER_LABEL_NEW_OWNER' })}
                    type="string"
                    isValid={
                        managingToken.newOwnerAddress.length > 0
                    }
                    value={managingToken.newOwnerAddress}
                    onChange={transferForm.onChangeData('newOwnerAddress')}
                />
                <div style={{ display: 'flex', columnGap: '10px' }}>
                    <TransferSubmitButton closePopup={onDismiss} />
                    <button className="btn btn-primary btn-lg form-submit btn-block" onClick={onDismiss} type="button">
                        {intl.formatMessage({
                            id: 'BUILDER_MANAGE_TOKEN_TRANSFER_BTN_TEXT_CANCEL',
                        })}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )
}

export const TransferPopup = observer(Popup)
