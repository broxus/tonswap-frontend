import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { SwapExchangeMode } from '@/modules/Swap/types'


function SubmitButton(): JSX.Element {
    const intl = useIntl()
    const formStore = useSwapFormStore()
    const tokensCache = formStore.useTokensCache
    const wallet = formStore.useWallet

    if (
        formStore.isPreparing
        || formStore.isSwapping
        || formStore.isCalculating
        || formStore.isLoading
        || !tokensCache.isReady
    ) {
        return (
            <Button
                block
                size="lg"
                type="primary"
                className="form-submit"
                aria-disabled="true"
                disabled
            >
                <Icon icon="loader" className="spin" />
            </Button>
        )
    }

    const buttonProps: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> = { disabled: true }
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
                id: 'EVER_WALLET_CONNECT_BTN_TEXT',
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
        <Button
            block
            size="lg"
            type="primary"
            className="form-submit"
            aria-disabled={buttonProps.disabled}
            {...buttonProps}
        >
            {buttonText}
        </Button>
    )
}

export const ConversionSubmitButton = observer(SubmitButton)
