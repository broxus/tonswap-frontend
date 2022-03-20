import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useWallet } from '@/stores/WalletService'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { useBalanceValidation } from '@/hooks/useBalanceValidation'
import { SwapDirection } from '@/modules/Swap/types'


function SubmitButton(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()
    const formStore = useSwapFormStore()

    if (formStore.isSwapping || formStore.isCalculating) {
        return (
            <button
                type="button"
                className="btn btn-primary btn-lg btn-block form-submit"
                aria-disabled="true"
                disabled
            >
                <div className="popup-main__loader">
                    <Icon icon="loader" />
                </div>
            </button>
        )
    }

    const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {}
    let buttonText: React.ReactNode = intl.formatMessage({ id: 'SWAP_BTN_TEXT_SUBMIT' })

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

        case formStore.leftToken === undefined || formStore.rightToken === undefined:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_SELECT_A_TOKEN',
            })
            break

        case formStore.leftAmount.length === 0 && formStore.direction === SwapDirection.LTR:
        case formStore.rightAmount.length === 0 && formStore.direction === SwapDirection.RTL:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_ENTER_AN_AMOUNT',
            })
            break

        case !formStore.isCrossExchangeAvailable:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_ROUTE_DOES_NOT_EXIST',
            })
            break

        case !useBalanceValidation(
            formStore.leftToken,
            formStore.direction === SwapDirection.LTR
                ? formStore.leftAmount
                : formStore.swap?.leftAmount,
        ):
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_INSUFFICIENT_TOKEN_BALANCE',
            }, {
                symbol: formStore.leftToken?.symbol || '',
                // eslint-disable-next-line react/no-multi-comp,react/destructuring-assignment,react/no-unstable-nested-components
                s: parts => <span className="truncate-name">{parts.join('')}</span>,
            })
            break

        case formStore.isConfirmationAwait:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_CONFIRMATION_AWAIT',
            })
            break

        case formStore.swap.isValid:
            buttonProps.onClick = () => {
                formStore.setState('isConfirmationAwait', true)
            }
            break

        default:
            buttonProps.disabled = !formStore.swap.isValid || formStore.isLoading
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

export const CrossExchangeSubmitButton = observer(SubmitButton)
