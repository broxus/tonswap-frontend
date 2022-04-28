import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { isAddressValid } from '@/misc'
import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { useWallet } from '@/stores/WalletService'

type Props = {
    closePopup: () => void;
}

function SubmitButton({ closePopup }: Props): JSX.Element {
    const { tokenRoot } = useParams<{ tokenRoot: string }>()

    const intl = useIntl()
    const wallet = useWallet()
    const managingToken = useManageTokenStore(tokenRoot)

    const buttonProps: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> = {
        disabled: managingToken.isTransfer,
    }
    let buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_BTN_TEXT_SUBMIT' })
    const showSpinner = managingToken.isTransfer

    switch (true) {
        case !wallet.account:
            buttonProps.disabled = wallet.isConnecting
            buttonProps.onClick = async () => {
                await wallet.connect()
            }
            buttonText = intl.formatMessage({
                id: 'EVER_WALLET_CONNECT_BTN_TEXT',
            })
            break

        case !managingToken.newOwnerAddress:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_BTN_TEXT_ENTER_ALL_DATA' })
            break

        case !isAddressValid(managingToken.newOwnerAddress, true):
            buttonProps.disabled = true
            buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_MESSAGE_ENTER_VALID_ADDRESS' })
            break

        case managingToken.newOwnerAddress != null:
            buttonProps.onClick = async () => {
                closePopup()
                await managingToken.transfer()
            }
            break

        default:
    }

    return (
        <Button
            aria-disabled={buttonProps.disabled}
            block
            className="form-submit"
            size="lg"
            type="primary"
            {...buttonProps}
        >
            {showSpinner ? (
                <div className="popup-main__loader">
                    <Icon icon="loader" />
                </div>
            ) : buttonText}
        </Button>
    )
}

export const TransferSubmitButton = observer(SubmitButton)
