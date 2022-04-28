import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { reaction } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { TokenIcons } from '@/components/common/TokenIcons'
import { SwapBill } from '@/modules/Swap/components/SwapBill'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'

import './index.scss'


function ConfirmationPopup(): JSX.Element {
    const intl = useIntl()
    const formStore = useSwapFormStore()

    const [minExpectedAmount, setMinExpectedAmount] = React.useState(formStore.swap.minExpectedAmount)
    const [leftAmount, setLeftAmount] = React.useState(formStore.swap.leftAmount)
    const [rightAmount, setRightAmount] = React.useState(formStore.swap.rightAmount)
    const [isChanged, setChangedTo] = React.useState(false)

    const onUpdate = () => {
        setMinExpectedAmount(formStore.swap.minExpectedAmount)
        setLeftAmount(formStore.swap.leftAmount)
        setRightAmount(formStore.swap.rightAmount)
        setChangedTo(false)
    }

    const onDismiss = () => {
        formStore.setState('isConfirmationAwait', false)
    }

    const onSubmit = async () => {
        formStore.setState('isConfirmationAwait', false)
        await formStore.submit()
    }

    React.useEffect(() => reaction(() => [
        formStore.swap.leftAmount,
        formStore.swap.rightAmount,
        formStore.swap.minExpectedAmount,
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
                <Button
                    type="icon"
                    onClick={onDismiss}
                    className="popup-close"
                >
                    <Icon icon="close" />
                </Button>
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
                        {formStore.multipleSwap.isEnoughTokenBalance && (
                            <div key="token-swap" className="btn form-drop form-drop-extra">
                                <span className="form-drop__logo">
                                    <TokenIcon
                                        address={formStore.leftToken?.root}
                                        icon={formStore.leftToken?.icon}
                                        name={formStore.leftToken?.symbol}
                                        size="small"
                                    />
                                </span>
                                <span className="form-drop__name">
                                    {formStore.leftToken?.symbol}
                                </span>
                            </div>
                        )}
                        {(
                            formStore.multipleSwap.isEnoughCoinBalance
                            && !formStore.multipleSwap.isEnoughTokenBalance
                        ) && (
                            <div key="coin-swap" className="btn form-drop form-drop-extra">
                                <span className="form-drop__logo">
                                    <TokenIcon
                                        icon={formStore.coin.icon}
                                        name={formStore.coin.symbol}
                                        size="small"
                                    />
                                </span>
                                <span className="form-drop__name">
                                    {formStore.coin.symbol}
                                </span>
                            </div>
                        )}
                        {(
                            !formStore.multipleSwap.isEnoughTokenBalance
                            && !formStore.multipleSwap.isEnoughCoinBalance
                            && formStore.multipleSwap.isEnoughCombinedBalance
                        ) && (
                            <div key="token-swap" className="btn form-drop form-drop-extra">
                                <span className="form-drop__logo">
                                    <TokenIcons
                                        icons={[
                                            {
                                                icon: formStore.coin.icon,
                                                name: formStore.coin.name,
                                            },
                                            {
                                                address: formStore.leftToken?.root,
                                                icon: formStore.leftToken?.icon,
                                                name: formStore.leftToken?.name,
                                            },
                                        ]}
                                    />
                                </span>
                                <span className="form-drop__name">
                                    {`${formStore.coin.symbol} + ${formStore.leftToken?.symbol}`}
                                </span>
                            </div>
                        )}
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
                        <div className="btn form-drop form-drop-extra">
                            <span className="form-drop__logo">
                                <TokenIcon
                                    address={formStore.rightToken?.root}
                                    name={formStore.rightToken?.symbol}
                                    size="small"
                                    icon={formStore.rightToken?.icon}
                                />
                            </span>
                            <span className="form-drop__name">
                                {formStore.rightToken?.symbol}
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
                            <Button
                                size="xs"
                                type="ghost"
                                onClick={onUpdate}
                            >
                                Update a rate
                            </Button>
                        </div>
                    </div>
                ) : (
                    <SwapBill
                        key="bill"
                        fee={formStore.swap.fee}
                        isCrossExchangeAvailable={false}
                        isCrossExchangeMode={false}
                        leftToken={formStore.leftToken}
                        minExpectedAmount={minExpectedAmount}
                        priceImpact={formStore.swap.priceImpact}
                        rightToken={formStore.rightToken}
                        slippage={formStore.swap.slippage}
                    />
                )}

                <Button
                    block
                    size="lg"
                    type="primary"
                    disabled={isChanged}
                    onClick={onSubmit}
                >
                    {intl.formatMessage({
                        id: 'SWAP_BTN_TEXT_CONFIRM_SUBMIT',
                    })}
                </Button>
            </div>
        </div>,
        document.body,
    )
}


export const MultiSwapConfirmationPopup = observer(ConfirmationPopup)
