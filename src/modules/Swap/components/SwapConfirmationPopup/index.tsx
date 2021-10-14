import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { reaction } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { SwapBill } from '@/modules/Swap/components/SwapBill'
import { useSwapStore } from '@/modules/Swap/stores/SwapStore'
import { SwapDirection } from '@/modules/Swap/types'

import './index.scss'


function ConfirmationPopup(): JSX.Element {
    const intl = useIntl()
    const swap = useSwapStore()

    const [minExpectedAmount, setMinExpectedAmount] = React.useState(swap.minExpectedAmount)
    const [leftAmount, setLeftAmount] = React.useState(
        () => ((swap.isCrossExchangeMode && swap.direction !== SwapDirection.LTR)
            ? swap.bestCrossExchangeRoute?.leftAmount
            : swap.leftAmount),
    )
    const [rightAmount, setRightAmount] = React.useState(
        () => ((swap.isCrossExchangeMode && swap.direction !== SwapDirection.RTL)
            ? swap.bestCrossExchangeRoute?.rightAmount
            : swap.rightAmount),
    )

    const [isChanged, setChangedTo] = React.useState(false)

    const onUpdate = () => {
        setMinExpectedAmount(swap.minExpectedAmount)
        setLeftAmount((swap.isCrossExchangeMode && swap.direction !== SwapDirection.LTR)
            ? swap.bestCrossExchangeRoute?.leftAmount
            : swap.leftAmount)
        setRightAmount((swap.isCrossExchangeMode && swap.direction !== SwapDirection.RTL)
            ? swap.bestCrossExchangeRoute?.rightAmount
            : swap.rightAmount)
        setChangedTo(false)
    }

    const onDismiss = () => {
        swap.changeState('isConfirmationAwait', false)
    }

    const onSubmit = async () => {
        swap.changeState('isConfirmationAwait', false)
        if (swap.isCrossExchangeMode) {
            await swap.crossExchangeSwap()
        }
        else {
            await swap.swap()
        }
    }

    React.useEffect(() => reaction(() => [
        (swap.isCrossExchangeMode && swap.direction !== SwapDirection.LTR)
            ? swap.bestCrossExchangeRoute?.leftAmount
            : swap.leftAmount,
        (swap.isCrossExchangeMode && swap.direction !== SwapDirection.RTL)
            ? swap.bestCrossExchangeRoute?.rightAmount
            : swap.rightAmount,
        swap.minExpectedAmount,
    ], ([
        nextLeftAmount,
        nextRightAmount,
        nextMinExpectedAmount,
    ]) => {
        setChangedTo(
            (
                nextLeftAmount !== leftAmount
                || nextRightAmount !== rightAmount
                || nextMinExpectedAmount !== minExpectedAmount
            ),
        )
    }), [])

    return ReactDOM.createPortal(
        <div className="popup">
            <div onClick={onDismiss} className="popup-overlay" />
            <div className="popup__wrap popup__wrap-confirm-swap">
                <button
                    type="button"
                    onClick={onDismiss}
                    className="btn btn-icon popup-close"
                >
                    <Icon icon="close" />
                </button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'SWAP_POPUP_CONFORMATION_TITLE',
                    })}
                </h2>

                <fieldset className="form-fieldset form-fieldset--small form-fieldset--dark">
                    <div className="form-fieldset__header">
                        <div>
                            {intl.formatMessage({
                                id: 'SWAP_FIELD_LABEL_LEFT',
                            })}
                        </div>
                    </div>
                    <div className="form-fieldset__main">
                        <input
                            className="form-input"
                            readOnly
                            type="text"
                            value={leftAmount}
                        />
                        <div className="btn form-drop">
                            <span className="form-drop__logo">
                                <TokenIcon
                                    address={swap.leftToken?.root}
                                    name={swap.leftToken?.symbol}
                                    size="small"
                                    uri={swap.leftToken?.icon}
                                />
                            </span>
                            <span className="form-drop__name">
                                {swap.leftToken?.symbol}
                            </span>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="form-fieldset form-fieldset--small form-fieldset--dark">
                    <div className="form-fieldset__header">
                        <div>
                            {intl.formatMessage({
                                id: 'SWAP_FIELD_LABEL_RIGHT',
                            })}
                        </div>
                    </div>
                    <div className="form-fieldset__main">
                        <input
                            className="form-input"
                            readOnly
                            type="text"
                            value={rightAmount}
                        />
                        <div className="btn form-drop">
                            <span className="form-drop__logo">
                                <TokenIcon
                                    address={swap.rightToken?.root}
                                    name={swap.rightToken?.symbol}
                                    size="small"
                                    uri={swap.rightToken?.icon}
                                />
                            </span>
                            <span className="form-drop__name">
                                {swap.rightToken?.symbol}
                            </span>
                        </div>
                    </div>
                </fieldset>

                {isChanged ? (
                    <div className="alert">
                        <div>
                            <strong>Update a rate to swap the tokens</strong>
                            <p>
                                The rate has changed. You can’t swap the tokens at the previous rate.
                            </p>
                        </div>
                        <div>
                            <button
                                type="button"
                                className="btn btn-xs btn--empty"
                                onClick={onUpdate}
                            >
                                Update a rate
                            </button>
                        </div>
                    </div>
                ) : (
                    <SwapBill
                        key="bill"
                        fee={swap.fee}
                        isCrossExchangeAvailable={swap.isCrossExchangeAvailable}
                        isCrossExchangeMode={swap.isCrossExchangeMode}
                        leftToken={swap.leftToken}
                        minExpectedAmount={minExpectedAmount}
                        priceImpact={swap.priceImpact}
                        rightToken={swap.rightToken}
                        slippage={swap.isCrossExchangeMode
                            ? swap.bestCrossExchangeRoute?.slippage
                            : swap.slippage}
                        tokens={swap.bestCrossExchangeRoute?.tokens}
                    />
                )}

                <button
                    type="button"
                    className="btn btn-md btn-primary btn-block"
                    disabled={isChanged}
                    onClick={onSubmit}
                >
                    {intl.formatMessage({
                        id: 'SWAP_BTN_TEXT_CONFIRM_SUBMIT',
                    })}
                </button>
            </div>
        </div>,
        document.body,
    )
}


export const SwapConfirmationPopup = observer(ConfirmationPopup)
