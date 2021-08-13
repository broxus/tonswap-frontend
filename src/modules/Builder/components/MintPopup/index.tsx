import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Icon } from '@/components/common/Icon'
import { BuilderField } from '@/modules/Builder/components/BuilderField'
import { MintSubmitButton } from '@/modules/Builder/components/MintSubmitButton'
import { useMintForm } from '@/modules/Builder/hooks/useMintForm'
import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { TargetAddressField } from '@/modules/Builder/components/TargetAddressField'
import { MintDetails } from '@/modules/Builder/components/MintDetails'

type Props = {
    onDismiss: () => void;
}


function Popup({ onDismiss }: Props): JSX.Element {
    const { rootToken } = useParams<{ rootToken: string }>()

    const intl = useIntl()
    const managingToken = useManageTokenStore(rootToken)
    const mintForm = useMintForm()

    return (
        <div className="popup">
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
                        id: 'BUILDER_MANAGE_TOKEN_MINT_POPUP_TITLE',
                    })}
                </h2>
                <TargetAddressField />
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
                <MintDetails />
                <div style={{ display: 'flex', columnGap: '10px' }}>
                    <button className="btn btn--grey btn-lg form-submit btn-block" onClick={onDismiss} type="button">
                        {intl.formatMessage({
                            id: 'BUILDER_MANAGE_TOKEN_TRANSFER_BTN_TEXT_CANCEL',
                        })}
                    </button>
                    <MintSubmitButton closePopup={onDismiss} />
                </div>
            </div>
        </div>
    )
}

export const MintPopup = observer(Popup)
