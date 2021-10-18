import * as React from 'react'
import classNames from 'classnames'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useBalanceValidation } from '@/hooks/useBalanceValidation'
import {
    CrossExchangeSubmitButton,
    SwapBill,
    SwapConfirmationPopup,
    SwapField,
    SwapPrice,
    SwapSettings,
    SwapSubmitButton,
    SwapTransaction,
} from '@/modules/Swap/components'
import { useSwapForm } from '@/modules/Swap/hooks/useSwapForm'
import { useSwapStore } from '@/modules/Swap/stores/SwapStore'
import { SwapDirection } from '@/modules/Swap/types'
import { TokensList } from '@/modules/TokensList'
import { TokenImportPopup } from '@/modules/TokensList/components'


import './index.scss'


export function Swap(): JSX.Element {
    const intl = useIntl()
    const swap = useSwapStore()
    const form = useSwapForm()

    return (
        <div className="container container--small">
            <div className="card">
                <div className="card__wrap">
                    <header className="card__header">
                        <h2 className="card-title">
                            {intl.formatMessage({
                                id: 'SWAP_HEADER_TITLE',
                            })}
                        </h2>

                        <SwapSettings />
                    </header>

                    <div className="form">
                        <Observer>
                            {() => (
                                <SwapField
                                    key="leftField"
                                    disabled={swap.isLoading || swap.isSwapping}
                                    label={intl.formatMessage({
                                        id: 'SWAP_FIELD_LABEL_LEFT',
                                    })}
                                    isValid={useBalanceValidation(
                                        swap.leftToken,
                                        swap.isCrossExchangeMode
                                            ? swap.crossExchangeLeftAmount || '0'
                                            : swap.leftAmount,
                                    )}
                                    readOnly={swap.isSwapping}
                                    token={swap.leftToken}
                                    value={(swap.isCrossExchangeMode && swap.direction === SwapDirection.RTL)
                                        ? swap.crossExchangeLeftAmount
                                        : swap.leftAmount}
                                    onChange={form.onChangeLeftAmount}
                                    onToggleTokensList={form.showTokensList('leftToken')}
                                />
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <div
                                    className={classNames('swap-icon', {
                                        disabled: swap.isLoading || swap.isSwapping,
                                    })}
                                    onClick={form.toggleTokensDirection}
                                >
                                    <Icon icon="reverse" />
                                </div>
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <SwapField
                                    key="rightField"
                                    disabled={swap.isLoading || swap.isSwapping}
                                    label={intl.formatMessage({
                                        id: 'SWAP_FIELD_LABEL_RIGHT',
                                    })}
                                    isValid={(swap.rightAmount.length > 0 && !swap.isCrossExchangeMode)
                                        ? swap.isEnoughLiquidity
                                        : true}
                                    readOnly={swap.isSwapping}
                                    token={swap.rightToken}
                                    value={(swap.isCrossExchangeMode && swap.direction === SwapDirection.LTR)
                                        ? swap.crossExchangeRightAmount
                                        : swap.rightAmount}
                                    onChange={form.onChangeRightAmount}
                                    onToggleTokensList={form.showTokensList('rightToken')}
                                />
                            )}
                        </Observer>

                        <SwapPrice key="price" />

                        <Observer>
                            {() => (swap.isCrossExchangeMode ? (
                                <CrossExchangeSubmitButton key="crossExchangeSubmitButton" />
                            ) : (
                                <SwapSubmitButton key="submitButton" />
                            ))}
                        </Observer>
                    </div>
                </div>
            </div>

            <Observer>
                {() => (
                    <SwapBill
                        key="bill"
                        fee={swap.fee}
                        isCrossExchangeAvailable={swap.isCrossExchangeAvailable}
                        isCrossExchangeMode={swap.isCrossExchangeMode}
                        leftToken={swap.leftToken}
                        minExpectedAmount={swap.minExpectedAmount}
                        priceImpact={swap.priceImpact}
                        rightToken={swap.rightToken}
                        slippage={swap.isCrossExchangeMode
                            ? swap.crossExchangeSlippage
                            : swap.slippage}
                        tokens={swap.bestCrossExchangeRoute?.tokens}
                    />
                )}
            </Observer>

            <SwapTransaction key="transaction" />

            <Observer>
                {() => (
                    <>
                        {swap.isConfirmationAwait && (
                            <SwapConfirmationPopup key="confirmationPopup" />
                        )}
                    </>
                )}
            </Observer>

            {(form.isTokenListShown && form.tokenSide != null) && (
                <TokensList
                    key="tokensList"
                    currentToken={swap[form.tokenSide]}
                    onDismiss={form.hideTokensList}
                    onSelectToken={form.onSelectToken}
                />
            )}

            {(form.isImporting && form.tokenToImport !== undefined) && (
                <TokenImportPopup
                    key="tokenImport"
                    token={form.tokenToImport}
                    onDismiss={form.onDismissImporting}
                    onImport={form.onDismissImporting}
                />
            )}
        </div>
    )
}
