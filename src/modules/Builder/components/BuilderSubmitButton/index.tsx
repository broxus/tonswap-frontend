import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useWallet } from '@/stores/WalletService'
import { useCreateTokenStore } from '@/modules/Builder/stores/CreateTokenStore'


function SubmitButton(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()
    const creatingToken = useCreateTokenStore()

    const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
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
                id: 'WALLET_BTN_TEXT_CONNECT',
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
        <button
            type="button"
            className="btn btn-primary btn-lg btn-block form-submit"
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

export const BuilderSubmitButton = observer(SubmitButton)
