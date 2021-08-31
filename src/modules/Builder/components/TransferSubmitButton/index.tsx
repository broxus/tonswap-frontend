import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'
import { useParams } from 'react-router-dom'

import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { useWallet } from '@/stores/WalletService'
import { Icon } from '@/components/common/Icon'

type Props = {
    closePopup: () => void;
}

function SubmitButton({ closePopup }: Props): JSX.Element {
    const { tokenRoot } = useParams<{ tokenRoot: string }>()

    const intl = useIntl()
    const wallet = useWallet()
    const managingToken = useManageTokenStore(tokenRoot)

    const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
        disabled: managingToken.isTransfer,
    }
    let buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_TRANSFER_BTN_TEXT_SUBMIT' })
    const showSpinner = managingToken.isTransfer

    switch (true) {
        case !wallet.account:
            buttonProps.disabled = wallet.isConnecting
            buttonProps.onClick = async () => {
                await wallet.connect()
            }
            buttonText = intl.formatMessage({
                id: 'WALLET_BTN_TEXT_CONNECT',
            })
            break

        case !managingToken.newOwnerAddress:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_BTN_TEXT_ENTER_ALL_DATA' })
            break

        case managingToken.newOwnerAddress != null:
            buttonProps.onClick = async () => {
                await managingToken.transfer()
                closePopup()
            }
            break

        default:
    }

    return (
        <button
            type="button"
            className="btn btn-tertiary btn-lg form-submit btn-block"
            aria-disabled={buttonProps.disabled}
            {...buttonProps}
        >
            {showSpinner ? (
                <div className="popup-main__loader">
                    <Icon icon="loader" />
                </div>
            ) : buttonText}
        </button>
    )
}

export const TransferSubmitButton = observer(SubmitButton)
