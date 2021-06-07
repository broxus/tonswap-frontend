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
        disabled: !swap.isValid,
    }
    let buttonText = intl.formatMessage({ id: 'SWAP_BTN_SWAP_TEXT' }),
        showSpinner = swap.isSwapping

    switch (true) {
        case !wallet.account:
            buttonProps.disabled = wallet.isConnecting
            buttonProps.onClick = async () => {
                await wallet.connect()
            }
            buttonText = intl.formatMessage({
                id: 'WALLET_BTN_CONNECT_TEXT',
            })
            break

        case !(swap.leftToken && swap.rightToken):
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_SELECT_A_TOKEN_TEXT',
            })
            break

        case swap.isLoading:
        case !swap.pair && swap.pairExist:
            buttonProps.disabled = true
            showSpinner = true
            break

        case !swap.pairExist:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_POOL_NOT_EXIST_TEXT',
            })
            break

        case swap.pair && !swap.isEnoughLiquidity:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_NOT_ENOUGH_LIQUIDITY_TEXT',
            })
            break

        case !swap.leftAmount || !swap.rightAmount:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'SWAP_BTN_ENTER_AN_AMOUNT_TEXT',
            })
            break

        case swap.pair && swap.isEnoughLiquidity:
            buttonProps.onClick = async () => {
                await swap.swap()
            }
            break

        default:
    }

    return (
        <button
            type="button"
            className="btn btn-light btn-lg swap-form-submit btn-block"
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
