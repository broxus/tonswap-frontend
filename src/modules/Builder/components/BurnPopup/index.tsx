import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Icon } from '@/components/common/Icon'
import { BuilderField } from '@/modules/Builder/components/BuilderField'
import { BurnSubmitButton } from '@/modules/Builder/components/BurnSubmitButton'
import { useBurnForm } from '@/modules/Builder/hooks/useBurnForm'
import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { BurnAddressField } from '@/modules/Builder/components/BurnAddressField'
import { BurnDetails } from '@/modules/Builder/components/BurnDetails'
import { isAddressValid } from '@/misc'

type Props = {
    onDismiss: () => void;
}


function Popup({ onDismiss }: Props): JSX.Element {
    const { rootToken } = useParams<{ rootToken: string }>()

    const intl = useIntl()
    const managingToken = useManageTokenStore(rootToken)
    const burnForm = useBurnForm()

    return ReactDOM.createPortal(
        <div className="popup">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <button
                    type="button"
                    className="btn btn-icon popup-close"
                    onClick={onDismiss}
                >
                    <Icon icon="close" />
                </button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'BUILDER_MANAGE_TOKEN_BURN_POPUP_TITLE',
                    })}
                </h2>
                <div className="form-builder">
                    <BurnAddressField />
                    <BuilderField
                        disabled={managingToken.isBurning}
                        label={intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_BURN_LABEL_AMOUNT' })}
                        type="number"
                        isValid={
                            managingToken.amountToBurn.length > 0
                        }
                        value={managingToken.amountToBurn}
                        onChange={burnForm.onChangeData('amountToBurn')}
                    />
                    <BuilderField
                        disabled={managingToken.isBurning}
                        label={intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_BURN_LABEL_CALLBACK_ADDRESS' })}
                        type="string"
                        isValid={
                            isAddressValid(managingToken.callbackAddress)
                        }
                        value={managingToken.callbackAddress}
                        onChange={burnForm.onChangeData('callbackAddress')}
                    />
                    <BuilderField
                        disabled={managingToken.isBurning}
                        label={intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_BURN_LABEL_CALLBACK_PAYLOAD' })}
                        type="string"
                        value={managingToken.callbackPayload}
                        onChange={burnForm.onChangeData('callbackPayload')}
                    />
                </div>
                <BurnDetails />
                <div className="popup-actions">
                    <button
                        className="btn btn-tertiary btn-lg btn-block form-submit"
                        onClick={onDismiss} type="button"
                    >
                        {intl.formatMessage({
                            id: 'BUILDER_MANAGE_TOKEN_BTN_TEXT_CANCEL',
                        })}
                    </button>
                    <BurnSubmitButton closePopup={onDismiss} />
                </div>
            </div>
        </div>,
        document.body,
    )
}

export const BurnPopup = observer(Popup)
