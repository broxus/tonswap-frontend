import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

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
        disabled: managingToken.isBurning,
    }
    let buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_BURN_BTN_TEXT' })
    const showSpinner = managingToken.isBurning

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

        case !isAddressValid(managingToken.targetAddress):
            buttonProps.disabled = true
            buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_MESSAGE_ENTER_VALID_ADDRESS' })
            break

        case !isAddressValid(managingToken.callbackAddress):
            buttonProps.disabled = true
            buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_MESSAGE_INVALID_CALLBACK_ADDRESS' })
            break

        case !managingToken.targetAddress || !managingToken.amountToBurn:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_BTN_TEXT_ENTER_ALL_DATA' })
            break

        case managingToken.targetAddress != null && managingToken.amountToBurn != null:
            buttonProps.onClick = async () => {
                closePopup()
                await managingToken.burn()
            }
            break

        default:
    }

    return (
        <Button
            aria-disabled={buttonProps.disabled}
            block
            size="lg"
            type="primary"
            className="form-submit"
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

export const BurnSubmitButton = observer(SubmitButton)
