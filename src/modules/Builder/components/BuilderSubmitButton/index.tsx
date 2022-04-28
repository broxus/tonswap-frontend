import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { useCreateTokenStore } from '@/modules/Builder/stores/CreateTokenStore'
import { useWallet } from '@/stores/WalletService'


function SubmitButton(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()
    const creatingToken = useCreateTokenStore()

    const buttonProps: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> = {
        disabled: creatingToken.isCreating,
    }
    let buttonText = intl.formatMessage({ id: 'BUILDER_CREATE_BTN_TEXT_SUBMIT' })
    const showSpinner = creatingToken.isCreating

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

        case !creatingToken.name || !creatingToken.symbol || !creatingToken.decimals:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({ id: 'BUILDER_CREATE_BTN_TEXT_ENTER_ALL_DATA' })
            break

        case creatingToken.name != null && creatingToken.symbol != null && creatingToken.decimals != null:
            buttonProps.onClick = async () => {
                await creatingToken.createToken()
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

export const BuilderSubmitButton = observer(SubmitButton)
