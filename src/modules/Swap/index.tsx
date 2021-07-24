import * as React from 'react'
import classNames from 'classnames'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useBalanceValidation } from '@/hooks/useBalanceValidation'
import {
    SwapBill,
    SwapField,
    SwapPrice,
    SwapSettings,
    SwapSubmitButton,
    SwapTransaction,
} from '@/modules/Swap/components'
import { useSwapForm } from '@/modules/Swap/hooks/useSwapForm'
import { useSwap } from '@/modules/Swap/stores/SwapStore'
import { SwapStoreDataProp } from '@/modules/Swap/types'
import { TokensList } from '@/modules/TokensList'

import './index.scss'


export function Swap(): JSX.Element {
    const intl = useIntl()
    const swap = useSwap()
    const swapForm = useSwapForm()

    return (
        <section className="section section--small">
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
                                        swap.leftAmount,
                                    )}
                                    readOnly={swap.isLoading || swap.isSwapping}
                                    token={swap.leftToken}
                                    value={swap.leftAmount}
                                    onChange={swapForm.onChangeData(
                                        SwapStoreDataProp.LEFT_AMOUNT,
                                    )}
                                    onToggleTokensList={swapForm.showTokensList(
                                        SwapStoreDataProp.LEFT_TOKEN,
                                    )}
                                />
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <div
                                    className={classNames('swap-icon', {
                                        disabled: swap.isLoading || swap.isSwapping,
                                    })}
                                    onClick={swap.toggleTokensDirection}
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
                                    isValid={swap.rightAmount.length > 0
                                        ? swap.isEnoughLiquidity
                                        : true}
                                    readOnly={swap.isLoading || swap.isSwapping}
                                    token={swap.rightToken}
                                    value={swap.rightAmount}
                                    onChange={swapForm.onChangeData(
                                        SwapStoreDataProp.RIGHT_AMOUNT,
                                    )}
                                    onToggleTokensList={swapForm.showTokensList(
                                        SwapStoreDataProp.RIGHT_TOKEN,
                                    )}
                                />
                            )}
                        </Observer>

                        <SwapPrice key="price" />

                        <SwapSubmitButton key="submitButton" />
                    </div>
                </div>
            </div>

            <SwapBill key="bill" />

            <SwapTransaction
                key="transaction"
                onDismiss={swapForm.onDismissTransactionReceipt}
            />

            {(swapForm.isTokenListShown && swapForm.tokenSide != null) && (
                <TokensList
                    key="tokensList"
                    currentToken={swap[swapForm.tokenSide]}
                    onDismiss={swapForm.hideTokensList}
                    onSelectToken={swapForm.onSelectToken}
                />
            )}
        </section>
    )
}
