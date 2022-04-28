import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { SwapDirection } from '@/modules/Swap/types'


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

    const buttonProps: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> = {}
    let buttonText: React.ReactNode = intl.formatMessage({ id: 'SWAP_BTN_TEXT_SUBMIT' })

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

        case formStore.leftToken === undefined || formStore.rightToken === undefined:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_SELECT_A_TOKEN',
            })
            break

        case (
            (formStore.leftAmount.length > 0 || formStore.rightAmount.length > 0)
            && (formStore.pair === undefined || !formStore.isEnoughLiquidity)
        ):
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_NOT_ENOUGH_LIQUIDITY',
            })
            break

        case formStore.leftAmount.length === 0 && formStore.direction === SwapDirection.LTR:
        case formStore.rightAmount.length === 0 && formStore.direction === SwapDirection.RTL:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_ENTER_AN_AMOUNT',
            })
            break

        case !formStore.isLeftAmountValid:
            buttonProps.disabled = true
            buttonText = formStore.isMultipleSwapMode ? intl.formatMessage({
                id: 'SWAP_BTN_TEXT_INSUFFICIENT_BALANCE',
            }) : intl.formatMessage({
                id: 'SWAP_BTN_TEXT_INSUFFICIENT_TOKEN_BALANCE',
            }, {
                symbol: (formStore.nativeCoinSide === 'leftToken' ? formStore.coin.symbol : formStore.leftToken?.symbol) || '',
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

        case formStore.isValid:
            buttonProps.onClick = () => {
                formStore.setState('isConfirmationAwait', true)
            }
            break

        default:
            buttonProps.disabled = !formStore.isValid || formStore.isLoading
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

export const SwapSubmitButton = observer(SubmitButton)
