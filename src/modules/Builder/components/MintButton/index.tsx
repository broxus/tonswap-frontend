import React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { MintPopup } from '@/modules/Builder/components/MintPopup'
import { useMintForm } from '@/modules/Builder/hooks/useMintForm'


function Button(): JSX.Element {
    const intl = useIntl()
    const mintForm = useMintForm()

    return (
        <>
            <button className="btn btn-primary" type="button" onClick={mintForm.showMintPopup}>
                {intl.formatMessage({
                    id: 'BUILDER_MANAGE_TOKEN_MINT_BTN_TEXT',
                })}
            </button>
            {mintForm.isMintPopupShown && <MintPopup onDismiss={mintForm.hideMintPopup} />}
        </>
    )
}

export const MintButton = observer(Button)
