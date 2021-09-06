import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { useWallet } from '@/stores/WalletService'
import { Icon } from '@/components/common/Icon'
import { isAddressValid } from '@/misc'

type Props = {
    closePopup: () => void;
}

function SubmitButton({ closePopup }: Props): JSX.Element {
    const { tokenRoot } = useParams<{ tokenRoot: string }>()

    const intl = useIntl()
    const wallet = useWallet()
    const managingToken = useManageTokenStore(tokenRoot)

    const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
        disabled: managingToken.isMinting,
    }
    let buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_MINT_BTN_TEXT' })
    const showSpinner = managingToken.isMinting

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

        case !isAddressValid(managingToken.targetAddress):
            buttonProps.disabled = true
            buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_MESSAGE_ENTER_VALID_ADDRESS' })
            break

        case !managingToken.targetAddress || !managingToken.amountToMint:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_BTN_TEXT_ENTER_ALL_DATA' })
            break

        case managingToken.targetAddress != null && managingToken.amountToMint != null:
            buttonProps.onClick = async () => {
                closePopup()
                await managingToken.mint()
            }
            break

        default:
    }

    return (
        <button
            type="button"
            className="btn btn-primary btn-lg form-submit btn-block"
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

export const MintSubmitButton = observer(SubmitButton)
