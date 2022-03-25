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
    SwapNotation,
    SwapPrice,
    SwapSettings,
    SwapSubmitButton,
    SwapTransactionReceipt,
} from '@/modules/Swap/components'
import { useSwapForm } from '@/modules/Swap/hooks/useSwapForm'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { SwapDirection } from '@/modules/Swap/types'
import { TokensList } from '@/modules/TokensList'
import { TokenImportPopup } from '@/modules/TokensList/components'

import './index.scss'


export function Swap(): JSX.Element {
    const intl = useIntl()
    const formStore = useSwapFormStore()
    const tokensCache = formStore.useTokensCache
    const wallet = formStore.useWallet
    const form = useSwapForm()

    return (
        <div className="container container--small">
            <div className="swap-container">
                <SwapNotation />
                <div className="card swap-card">
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
                                        balance={formStore.formattedLeftBalance}
                                        disabled={formStore.isLoading || formStore.isSwapping}
                                        id="leftField"
                                        isMultiple={formStore.isMultipleSwapMode}
                                        isValid={(
                                            formStore.isLoading
                                            || formStore.isSwapping
                                            || formStore.isLeftAmountValid
                                        )}
                                        nativeCoin={(formStore.isMultipleSwapMode || formStore.nativeCoinSide === 'leftToken')
                                            ? formStore.coin
                                            : undefined}
                                        readOnly={formStore.isPreparing || formStore.isSwapping}
                                        showMaximizeButton={formStore.leftBalanceNumber.gt(0)}
                                        token={formStore.leftToken}
                                        value={(
                                            formStore.isCrossExchangeMode
                                            && formStore.direction === SwapDirection.RTL
                                        ) ? formStore.crossPairSwap.leftAmount : formStore.leftAmount}
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
                                            disabled: (
                                                formStore.isPreparing
                                                || formStore.isLoading
                                                || formStore.isSwapping
                                            ),
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
                                        balance={formStore.formattedRightBalance}
                                        disabled={formStore.isLoading || formStore.isSwapping}
                                        id="rightField"
                                        isValid={(
                                            formStore.isLoading
                                            || formStore.isSwapping
                                            || formStore.isRightAmountValid
                                        )}
                                        nativeCoin={formStore.nativeCoinSide === 'rightToken' ? formStore.coin : undefined}
                                        readOnly={formStore.isPreparing || formStore.isSwapping}
                                        token={formStore.rightToken}
                                        value={(
                                            formStore.isCrossExchangeMode
                                            && formStore.direction === SwapDirection.LTR
                                        ) ? formStore.crossPairSwap.rightAmount : formStore.rightAmount}
                                        onChange={form.onChangeRightAmount}
                                        onToggleTokensList={form.showTokensList('rightToken')}
                                    />
                                )}
                            </Observer>

                            <Observer>
                                {() => (
                                    <>
                                        {(
                                            wallet.isConnected
                                            && !formStore.isPreparing
                                            && !formStore.isConversionMode
                                        ) && (
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
                                leftToken={formStore.nativeCoinSide === 'leftToken' ? formStore.coin : formStore.leftToken}
                                minExpectedAmount={formStore.swap.minExpectedAmount}
                                priceImpact={formStore.swap.priceImpact}
                                rightToken={formStore.nativeCoinSide === 'rightToken' ? formStore.coin : formStore.rightToken}
                                slippage={formStore.swap.slippage}
                                tokens={formStore.route?.tokens}
                            />
                        )}
                        {/*
                        {process.env.NODE_ENV === 'development' && (
                            <>
                                <p>DEBUG</p>
                                <p>{`mode: ${formStore.exchangeMode}`}</p>
                                <p>{`is multiple: ${formStore.isMultipleSwapMode}`}</p>
                                <p>{`is coin-based swap: ${formStore.isCoinBasedSwapMode}`}</p>
                                <p>{`is cross-pair: ${formStore.isCrossExchangeMode}`}</p>
                                <p>{`is cross-pair available: ${formStore.isCrossExchangeAvailable}`}</p>
                                <p>{`coin side: ${formStore.nativeCoinSide}`}</p>
                                <p>{`left token: ${formStore.leftToken?.symbol} ${sliceAddress(formStore.leftToken?.root)}`}</p>
                                <p>{`right token: ${formStore.rightToken?.symbol} ${sliceAddress(formStore.rightToken?.root)}`}</p>
                                <p>{`pair: ${formStore.pair !== undefined}`}</p>
                            </>
                        )}
                        */}
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
