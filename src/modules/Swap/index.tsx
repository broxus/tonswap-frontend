import * as React from 'react'
import classNames from 'classnames'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useBalanceValidation } from '@/hooks/useBalanceValidation'
import { TokensList } from '@/modules/TokensList'
import {
    SwapBill,
    SwapField,
    SwapPrice,
    SwapSettings,
    SwapSubmitButton,
    SwapTransaction,
} from '@/modules/Swap/components'
import { TokenSide, useSwapForm } from '@/modules/Swap/hooks/useSwapForm'
import { SwapDirection, useSwap } from '@/modules/Swap/stores/SwapStore'

import './index.scss'


export function Swap(): JSX.Element {
    const intl = useIntl()
    const swap = useSwap()
    const swapForm = useSwapForm()

    return (
        <>
            <div className="swap">
                <div className="swap__wrap">
                    <div className="swap__header">
                        <h2 className="swap-title">
                            {intl.formatMessage({
                                id: 'SWAP_HEADER_TITLE',
                            })}
                        </h2>
                        <SwapSettings />
                    </div>

                    <div className="swap-form">
                        <Observer>
                            {() => (
                                <>
                                    <SwapField
                                        key="leftField"
                                        disabled={swap.isLoading || swap.isSwapping}
                                        label={intl.formatMessage({
                                            id: 'SWAP_FIELD_LEFT_LABEL',
                                        })}
                                        isValid={useBalanceValidation(swap.leftToken, swap.leftAmount)}
                                        token={swap.leftToken}
                                        value={swap.leftAmount}
                                        onChange={swapForm.onChangeData('leftAmount')}
                                        onToggleTokensList={swapForm.showTokensList('leftToken')}
                                    />

                                    <div
                                        className={classNames('swap-form-change', {
                                            loading: swap.isLoading || swap.isSwapping,
                                        })}
                                        onClick={swap.toggleTokensDirection}
                                    >
                                        <Icon icon="reverse" />
                                    </div>

                                    <SwapField
                                        key="rightField"
                                        disabled={swap.isLoading || swap.isSwapping}
                                        label={intl.formatMessage({
                                            id: 'SWAP_FIELD_RIGHT_LABEL',
                                        })}
                                        isValid={swap.direction === SwapDirection.RTL
                                            ? swap.isEnoughLiquidity
                                            : true}
                                        token={swap.rightToken}
                                        value={swap.rightAmount}
                                        onChange={swapForm.onChangeData('rightAmount')}
                                        onToggleTokensList={swapForm.showTokensList('rightToken')}
                                    />
                                </>
                            )}
                        </Observer>

                        <SwapPrice key="price" />

                        <SwapSubmitButton key="submitButton" />
                    </div>
                </div>

                <SwapBill key="bill" />
            </div>

            <SwapTransaction
                key="transaction"
                onClose={swapForm.onCloseTransactionReceipt}
            />

            {swapForm.isTokenListShown && (
                <TokensList
                    key="tokensList"
                    currentToken={swap[swapForm.tokenSide as TokenSide]}
                    onClose={swapForm.hideTokensList}
                    onSelectToken={swapForm.onSelectToken}
                />
            )}
        </>
    )
}
