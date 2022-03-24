import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { SwapDirection } from '@/modules/Swap/types'
import { formattedTokenAmount } from '@/utils'

import './index.scss'


function Price(): JSX.Element | null {
    const intl = useIntl()
    const formStore = useSwapFormStore()

    if (formStore.leftToken === undefined || formStore.rightToken === undefined) {
        return null
    }

    return (
        <div className="form-row swap-price">
            <div>
                {(() => {
                    switch (true) {
                        case formStore.isCrossExchangeOnly:
                            return (
                                <div
                                    className="btn btn-xs btn-secondary swap-price__exchange-mode-btn"
                                >
                                    {intl.formatMessage({
                                        id: 'SWAP_PRICE_CROSS_EXCHANGE_MODE_ONLY_LABEL',
                                    })}
                                </div>
                            )

                        case formStore.isCrossExchangeMode:
                            return (
                                <button
                                    type="button"
                                    className="btn btn-xs btn-secondary swap-price__exchange-mode-btn"
                                    disabled={formStore.isSwapping}
                                    onClick={formStore.toggleSwapExchangeMode}
                                >
                                    {intl.formatMessage({
                                        id: 'SWAP_PRICE_DIRECT_EXCHANGE_MODE_LABEL',
                                    })}
                                </button>
                            )

                        case (
                            formStore.isCrossExchangeAvailable
                            && formStore.route !== undefined
                        ):
                            return (
                                <button
                                    type="button"
                                    className="btn btn-xs btn-secondary swap-price__exchange-mode-btn"
                                    disabled={formStore.isSwapping}
                                    onClick={formStore.toggleSwapExchangeMode}
                                >
                                    {intl.formatMessage({
                                        // eslint-disable-next-line no-nested-ternary
                                        id: !formStore.isEnoughLiquidity
                                            ? 'SWAP_PRICE_CROSS_EXCHANGE_AVAILABLE_LABEL'
                                            : 'SWAP_PRICE_CROSS_EXCHANGE_MODE_LABEL',
                                    })}
                                </button>
                            )

                        default:
                            return (
                                <div
                                    className="btn btn-xs btn-secondary swap-price__exchange-mode-btn"
                                >
                                    {intl.formatMessage({
                                        id: 'SWAP_PRICE_LABEL',
                                    })}
                                </div>
                            )
                    }
                })()}
            </div>
            <div className="swap-price-details">
                {formStore.priceDirection === SwapDirection.RTL ? (
                    <span
                        key={SwapDirection.RTL}
                        dangerouslySetInnerHTML={{
                            __html: intl.formatMessage({
                                id: 'SWAP_PRICE_RESULT',
                            }, {
                                value: formStore.swap.priceLeftToRight !== undefined
                                    ? formattedTokenAmount(
                                        formStore.swap.priceLeftToRight,
                                        formStore.leftToken.decimals,
                                    )
                                    : '--',
                                leftSymbol: formStore.nativeCoinSide === 'leftToken' ? formStore.coin.symbol : formStore.leftToken.symbol,
                                rightSymbol: formStore.nativeCoinSide === 'rightToken' ? formStore.coin.symbol : formStore.rightToken.symbol,
                            }, {
                                ignoreTag: true,
                            }),
                        }}
                    />
                ) : (
                    <span
                        key={SwapDirection.LTR}
                        dangerouslySetInnerHTML={{
                            __html: intl.formatMessage({
                                id: 'SWAP_PRICE_RESULT',
                            }, {
                                value: formStore.swap.priceRightToLeft !== undefined
                                    ? formattedTokenAmount(
                                        formStore.swap.priceRightToLeft,
                                        formStore.rightToken.decimals,
                                    )
                                    : '--',
                                leftSymbol: formStore.nativeCoinSide === 'rightToken' ? formStore.coin.symbol : formStore.rightToken.symbol,
                                rightSymbol: formStore.nativeCoinSide === 'leftToken' ? formStore.coin.symbol : formStore.leftToken.symbol,
                            }, {
                                ignoreTag: true,
                            }),
                        }}
                    />
                )}
                <button
                    type="button"
                    className="btn form-row__btn swap-price__reverse-btn"
                    onClick={formStore.togglePriceDirection}
                >
                    <Icon icon="reverseHorizontal" />
                </button>
            </div>
        </div>
    )
}

export const SwapPrice = observer(Price)
