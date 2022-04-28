import React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { MintPopup } from '@/modules/Builder/components/MintPopup'
import { useMintForm } from '@/modules/Builder/hooks/useMintForm'


function ButtonInternal(): JSX.Element {
    const intl = useIntl()
    const mintForm = useMintForm()

    return (
        <>
            <Button
                type="primary"
                onClick={mintForm.showMintPopup}
            >
                {intl.formatMessage({
                    id: 'BUILDER_MANAGE_TOKEN_MINT_BTN_TEXT',
                })}
            </Button>
            {mintForm.isMintPopupShown && <MintPopup onDismiss={mintForm.hideMintPopup} />}
        </>
    )
}

export const MintButton = observer(ButtonInternal)
