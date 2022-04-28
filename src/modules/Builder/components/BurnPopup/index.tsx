import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { BuilderField } from '@/modules/Builder/components/BuilderField'
import { BurnSubmitButton } from '@/modules/Builder/components/BurnSubmitButton'
import { useBurnForm } from '@/modules/Builder/hooks/useBurnForm'
import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { BurnAddressField } from '@/modules/Builder/components/BurnAddressField'
import { BurnDetails } from '@/modules/Builder/components/BurnDetails'
import { isAddressValid } from '@/misc'
import { usePage } from '@/hooks/usePage'

type Props = {
    onDismiss: () => void;
}


function Popup({ onDismiss }: Props): JSX.Element {
    const { rootToken } = useParams<{ rootToken: string }>()

    const intl = useIntl()
    const managingToken = useManageTokenStore(rootToken)
    const burnForm = useBurnForm()
    const page = usePage()

    React.useEffect(() => {
        page.block()
        burnForm.onChangeData('amountToBurn')('')
        burnForm.onChangeData('callbackPayload')('')

        return () => {
            page.unblock()
        }
    }, [])

    return ReactDOM.createPortal(
        <div className="popup popup_scrollable">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <Button
                    type="icon"
                    className="popup-close"
                    onClick={onDismiss}
                >
                    <Icon icon="close" />
                </Button>
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
                    <BurnSubmitButton closePopup={onDismiss} />
                </div>
            </div>
        </div>,
        document.body,
    )
}

export const BurnPopup = observer(Popup)
