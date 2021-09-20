import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Icon } from '@/components/common/Icon'
import { BuilderField } from '@/modules/Builder/components/BuilderField'
import { MintSubmitButton } from '@/modules/Builder/components/MintSubmitButton'
import { useMintForm } from '@/modules/Builder/hooks/useMintForm'
import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { MintAddressField } from '@/modules/Builder/components/MintAddressField'
import { MintDetails } from '@/modules/Builder/components/MintDetails'

type Props = {
    onDismiss: () => void;
}


function Popup({ onDismiss }: Props): JSX.Element {
    const intl = useIntl()
    const { rootToken } = useParams<{ rootToken: string }>()
    const managingToken = useManageTokenStore(rootToken)
    const mintForm = useMintForm()

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
                        id: 'BUILDER_MANAGE_TOKEN_MINT_POPUP_TITLE',
                    })}
                </h2>
                <div className="form-builder">
                    <MintAddressField />
                    <BuilderField
                        disabled={managingToken.isMinting}
                        label={intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_MINT_LABEL_AMOUNT' })}
                        type="number"
                        isValid={
                            managingToken.amountToMint.length > 0
                        }
                        value={managingToken.amountToMint}
                        onChange={mintForm.onChangeData('amountToMint')}
                    />
                </div>
                <MintDetails />
                <div className="popup-actions">
                    <button className="btn btn-tertiary btn-lg form-submit btn-block" onClick={onDismiss} type="button">
                        {intl.formatMessage({
                            id: 'BUILDER_MANAGE_TOKEN_BTN_TEXT_CANCEL',
                        })}
                    </button>
                    <MintSubmitButton closePopup={onDismiss} />
                </div>
            </div>
        </div>,
        document.body,
    )
}

export const MintPopup = observer(Popup)
