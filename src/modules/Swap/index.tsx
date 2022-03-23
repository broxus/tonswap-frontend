import * as React from 'react'
import classNames from 'classnames'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import {
    ConversionSubmitButton,
    ConversionTransactionReceipt,
    CrossExchangeSubmitButton,
    MultiSwapConfirmationPopup,
    SwapBill,
    SwapConfirmationPopup,
    SwapField,
    SwapPrice,
    SwapSettings,
    SwapSubmitButton,
    SwapTransactionReceipt,
} from '@/modules/Swap/components'
import { useSwapForm } from '@/modules/Swap/hooks/useSwapForm'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { TokensList } from '@/modules/TokensList'
import { TokenImportPopup } from '@/modules/TokensList/components'

import './index.scss'


export function Swap(): JSX.Element {
    const intl = useIntl()
    const formStore = useSwapFormStore()
    const tokensCache = formStore.useTokensCache
    const form = useSwapForm()

    return (
        <div className="container container--small">
            <div className="card">
                <div className="card__wrap">
                    <header className="card__header">
                        <Observer>
                            {() => (
                                <h2 className="card-title">
                                    {intl.formatMessage({
                                        id: 'SWAP_HEADER_TITLE',
                                    })}
                                </h2>
                            )}
                        </Observer>

                        <SwapSettings />
                    </header>

                    <div className="form">
                        <Observer>
                            {() => (
                                <SwapField
                                    key="leftField"
                                    balance={formStore.leftBalance}
                                    disabled={formStore.isLoading || formStore.isSwapping}
                                    label={intl.formatMessage({
                                        id: 'SWAP_FIELD_LABEL_LEFT',
                                    })}
                                    id="leftField"
                                    isMultiple={formStore.isMultipleSwapMode}
                                    isValid={formStore.isSwapping || formStore.isLeftAmountValid}
                                    nativeCoin={(formStore.isMultipleSwapMode || formStore.nativeCoinSide === 'leftToken')
                                        ? formStore.coin
                                        : undefined}
                                    readOnly={formStore.isSwapping}
                                    token={formStore.leftToken}
                                    value={formStore.leftAmount}
                                    onChange={form.onChangeLeftAmount}
                                    onMaximize={formStore.maximizeLeftAmount}
                                    onToggleTokensList={form.showTokensList('leftToken')}
                                />
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <div
                                    className={classNames('swap-icon', {
                                        disabled: formStore.isLoading || formStore.isSwapping,
                                    })}
                                    onClick={formStore.isConversionMode
                                        ? form.toggleConversionDirection
                                        : form.toggleSwapDirection}
                                >
                                    <Icon icon="reverse" />
                                </div>
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <SwapField
                                    key="rightField"
                                    balance={formStore.rightBalance}
                                    disabled={formStore.isLoading || formStore.isSwapping}
                                    label={intl.formatMessage({
                                        id: 'SWAP_FIELD_LABEL_RIGHT',
                                    })}
                                    id="rightField"
                                    isValid={formStore.isRightAmountValid}
                                    nativeCoin={formStore.nativeCoinSide === 'rightToken' ? formStore.coin : undefined}
                                    readOnly={formStore.isSwapping}
                                    token={formStore.rightToken}
                                    value={formStore.rightAmount}
                                    onChange={form.onChangeRightAmount}
                                    onToggleTokensList={form.showTokensList('rightToken')}
                                />
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <>
                                    {!formStore.isConversionMode && (
                                        <SwapPrice key="price" />
                                    )}
                                </>
                            )}
                        </Observer>

                        <Observer>
                            {() => {
                                switch (true) {
                                    case formStore.isConversionMode:
                                        return <ConversionSubmitButton key="conversionSubmitButton" />

                                    case formStore.isCrossExchangeMode:
                                        return <CrossExchangeSubmitButton key="crossExchangeSubmitButton" />

                                    default:
                                        return <SwapSubmitButton key="submitButton" />
                                }
                            }}
                        </Observer>
                    </div>
                </div>
            </div>

            <Observer>
                {() => (
                    <>
                        {!formStore.isConversionMode && (
                            <SwapBill
                                key="bill"
                                fee={formStore.swap.fee}
                                isCrossExchangeAvailable={formStore.isCrossExchangeAvailable}
                                isCrossExchangeMode={formStore.isCrossExchangeMode}
                                leftToken={formStore.leftToken}
                                minExpectedAmount={formStore.swap.minExpectedAmount}
                                priceImpact={formStore.swap.priceImpact}
                                rightToken={formStore.rightToken}
                                slippage={formStore.swap.slippage}
                                tokens={formStore.route?.tokens}
                            />
                        )}
                    </>
                )}
            </Observer>

            <SwapTransactionReceipt key="swap-transaction-receipt" />

            <ConversionTransactionReceipt key="conversion-transaction-receipt" />

            <Observer>
                {() => (
                    <>
                        {formStore.isConfirmationAwait && (
                            <>
                                {formStore.isMultipleSwapMode ? (
                                    <MultiSwapConfirmationPopup key="multiSwapConfirmationPopup" />
                                ) : (
                                    <SwapConfirmationPopup key="confirmationPopup" />
                                )}
                            </>
                        )}
                    </>
                )}
            </Observer>

            {(form.isTokenListShown && form.tokenSide === 'leftToken') && (
                <TokensList
                    key="leftTokensList"
                    allowMultiple
                    currentToken={formStore.leftToken}
                    currentTokenSide="leftToken"
                    isMultiple={formStore.isMultipleSwapMode}
                    combinedTokenRoot={formStore.multipleSwapTokenRoot}
                    nativeCoin={formStore.coin}
                    nativeCoinSide={formStore.nativeCoinSide}
                    onDismiss={form.hideTokensList}
                    onSelectMultipleSwap={form.onSelectMultipleSwap}
                    onSelectNativeCoin={form.onSelectLeftNativeCoin}
                    onSelectToken={form.onSelectLeftToken}
                />
            )}

            {(form.isTokenListShown && form.tokenSide === 'rightToken') && (
                <TokensList
                    key="rightTokensList"
                    allowMultiple={false}
                    currentToken={formStore.rightToken}
                    currentTokenSide="rightToken"
                    isMultiple={formStore.isMultipleSwapMode}
                    combinedTokenRoot={formStore.multipleSwapTokenRoot}
                    nativeCoin={formStore.coin}
                    nativeCoinSide={formStore.nativeCoinSide}
                    onDismiss={form.hideTokensList}
                    onSelectNativeCoin={form.onSelectRightNativeCoin}
                    onSelectToken={form.onSelectRightToken}
                />
            )}

            <Observer>
                {() => (
                    <>
                        {tokensCache.isImporting && (
                            <TokenImportPopup key="tokenImport" />
                        )}
                    </>
                )}
            </Observer>
        </div>
    )
}
