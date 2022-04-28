import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { usePage } from '@/hooks/usePage'
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
    const page = usePage()

    React.useEffect(() => {
        page.block()
        mintForm.onChangeData('amountToMint')('')

        return () => {
            page.unblock()
        }
    }, [])

    return ReactDOM.createPortal(
        <div className="popup popup_scrollable">
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
                    <MintSubmitButton closePopup={onDismiss} />
                </div>
            </div>
        </div>,
        document.body,
    )
}

export const MintPopup = observer(Popup)
