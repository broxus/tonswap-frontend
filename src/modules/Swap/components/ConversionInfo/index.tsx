import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { SwapExchangeMode } from '@/modules/Swap/types'

import './index.scss'


export function ConversionInfo(): JSX.Element {
    const intl = useIntl()
    const formStore = useSwapFormStore()

    return (
        <div className="form-row conversion-info">
            <Observer>
                {() => (
                    <>
                        <div className="conversion-info-label">
                            {(() => {
                                switch (formStore.exchangeMode) {
                                    case SwapExchangeMode.WRAP_EVER:
                                        return intl.formatMessage({
                                            id: formStore.conversion.isInsufficientWrapBalance
                                                ? 'CONVERSION_FORM_INSUFFICIENT_BALANCE'
                                                : 'CONVERSION_FORM_EXPECTED_AMOUNT',
                                        })

                                    case SwapExchangeMode.UNWRAP_WEVER:
                                        return intl.formatMessage({
                                            id: formStore.conversion.isInsufficientUnwrapBalance
                                                ? 'CONVERSION_FORM_INSUFFICIENT_BALANCE'
                                                : 'CONVERSION_FORM_EXPECTED_AMOUNT',
                                        })

                                    default:
                                        return null
                                }
                            })()}
                        </div>
                        <div className="conversion-info-label">
                            {(() => {
                                switch (formStore.exchangeMode) {
                                    case SwapExchangeMode.WRAP_EVER:
                                        if (formStore.conversion.isInsufficientWrapBalance) {
                                            return null
                                        }

                                        return formStore.leftAmount?.length === 0
                                            ? '--'
                                            : intl.formatMessage({
                                                id: 'CONVERSION_FORM_EXPECTED_AMOUNT_VALUE',
                                            }, {
                                                symbol: formStore.rightToken?.symbol,
                                                value: formStore.leftAmount,
                                            })

                                    default:
                                        if (formStore.conversion.isInsufficientUnwrapBalance) {
                                            return null
                                        }

                                        return formStore.leftAmount?.length === 0
                                            ? '--'
                                            : intl.formatMessage({
                                                id: 'CONVERSION_FORM_EXPECTED_AMOUNT_VALUE',
                                            }, {
                                                symbol: formStore.coin?.symbol,
                                                value: formStore.leftAmount,
                                            })
                                }
                            })()}
                        </div>
                    </>
                )}
            </Observer>
        </div>
    )
}
