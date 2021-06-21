import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useWallet } from '@/stores/WalletService'
import { useSwap } from '@/modules/Swap/stores/SwapStore'


function SubmitButton(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()
    const swap = useSwap()

    const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
        disabled: !swap.isValid || swap.isLoading || swap.isSwapping,
    }
    let buttonText = intl.formatMessage({ id: 'SWAP_BTN_TEXT_SUBMIT' }),
        showSpinner = swap.isLoading || swap.isSwapping

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

        case !(swap.leftToken && swap.rightToken):
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_SELECT_A_TOKEN',
            })
            break

        case !swap.pair?.address && swap.pairExist:
            buttonProps.disabled = true
            showSpinner = true
            break

        case !swap.pairExist:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_POOL_NOT_EXIST',
            })
            break

        case swap.pair?.address && !swap.isEnoughLiquidity:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_NOT_ENOUGH_LIQUIDITY',
            })
            break

        case swap.leftAmount.length === 0 || swap.rightAmount.length === 0:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_TEXT_ENTER_AN_AMOUNT',
            })
            break

        case swap.pair?.address && swap.isEnoughLiquidity:
            buttonProps.onClick = async () => {
                await swap.swap()
            }
            break

        default:
    }

    return (
        <button
            type="button"
            className="btn btn-light btn-lg form-submit btn-block"
            aria-disabled={buttonProps.disabled}
            {...buttonProps}
        >
            {showSpinner ? (
                <div className="swap-popup-main__loader">
                    <Icon icon="loader" />
                </div>
            ) : buttonText}
        </button>
    )
}

export const SwapSubmitButton = observer(SubmitButton)
