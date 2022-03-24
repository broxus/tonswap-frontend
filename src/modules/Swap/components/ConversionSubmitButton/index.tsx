import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { SwapExchangeMode } from '@/modules/Swap/types'


function SubmitButton(): JSX.Element {
    const intl = useIntl()
    const formStore = useSwapFormStore()
    const wallet = formStore.useWallet

    if (formStore.conversion.isProcessing) {
        return (
            <button
                type="button"
                className="btn btn-primary btn-lg btn-block form-submit"
                aria-disabled="true"
                disabled
            >
                <Icon icon="loader" className="spin" />
            </button>
        )
    }

    const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = { disabled: true }
    let buttonText: React.ReactNode = intl.formatMessage({ id: 'CONVERSION_FORM_SUBMIT_BTN_TEXT' })

    if (formStore.isWrapMode) {
        buttonText = intl.formatMessage({
            id: 'CONVERSION_FORM_WRAP_BTN_TEXT',
        }, { symbol: formStore.conversion.coin?.symbol })
    }
    else if (formStore.isUnwrapMode) {
        buttonText = intl.formatMessage({
            id: 'CONVERSION_FORM_UNWRAP_BTN_TEXT',
        }, { symbol: formStore.conversion.token?.symbol })
    }

    switch (true) {
        case wallet.account === undefined:
            buttonProps.disabled = wallet.isConnecting
            buttonProps.onClick = async () => {
                await wallet.connect()
            }
            buttonText = intl.formatMessage({
                id: 'WALLET_BTN_TEXT_CONNECT',
            })
            break

        case formStore.isWrapMode && formStore.conversion.isWrapValid:
            buttonProps.disabled = false
            buttonProps.onClick = async () => {
                await formStore.conversion.wrap()
            }
            break

        case formStore.isUnwrapMode && formStore.conversion.isUnwrapValid:
            buttonProps.disabled = false
            buttonProps.onClick = async () => {
                if (formStore.exchangeMode === SwapExchangeMode.WRAP_EVER) {
                    await formStore.conversion.wrap()
                }
                else {
                    await formStore.conversion.unwrap()
                }
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
            {buttonText}
        </button>
    )
}

export const ConversionSubmitButton = observer(SubmitButton)
