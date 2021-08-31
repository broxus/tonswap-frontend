import React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { useMintForm } from '@/modules/Builder/hooks/useMintForm'
import { MintPopup } from '@/modules/Builder/components/MintPopup'

function Button(): JSX.Element {
    const intl = useIntl()
    const mintForm = useMintForm()

    const onClick = () => {
        mintForm.showMintPopup()
    }

    const onDismiss = () => {
        mintForm.hideMintPopup()
    }

    return (
        <>
            <button className="btn btn-primary" type="button" onClick={onClick}>
                {intl.formatMessage({
                    id: 'BUILDER_MANAGE_TOKEN_MINT_BTN_TEXT',
                })}
            </button>
            {mintForm.isMintPopupShown && <MintPopup onDismiss={onDismiss} />}
        </>
    )
}

export const MintButton = observer(Button)
