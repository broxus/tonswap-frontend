import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useSwapStore } from '@/modules/Swap/stores/SwapStore'
import { SwapDirection } from '@/modules/Swap/types'
import { formattedAmount } from '@/utils'

import './index.scss'


function Price(): JSX.Element | null {
    const intl = useIntl()
    const swap = useSwapStore()

    if (swap.leftToken === undefined || swap.rightToken === undefined) {
        return null
    }

    const onClickReverse = () => {
        swap.togglePriceDirection()
    }

    return (
        <div className="form-row swap-price">
            <div>
                {(() => {
                    switch (true) {
                        case swap.isCrossExchangeOnly && swap.isCrossExchangeMode:
                            return (
                                <div
                                    className="btn btn-xs btn-secondary swap-price__exchange-mode-btn"
                                >
                                    {intl.formatMessage({
                                        id: 'SWAP_PRICE_CROSS_EXCHANGE_MODE_ONLY_LABEL',
                                    })}
                                </div>
                            )

                        case swap.pair !== undefined && swap.isCrossExchangeMode:
                            return (
                                <button
                                    type="button"
                                    className="btn btn-xs btn-secondary swap-price__exchange-mode-btn"
                                    disabled={swap.isSwapping}
                                    onClick={swap.toggleSwapExchangeMode}
                                >
                                    {intl.formatMessage({
                                        id: 'SWAP_PRICE_DIRECT_EXCHANGE_MODE_LABEL',
                                    })}
                                </button>
                            )

                        case (
                            (swap.pair !== undefined || !swap.isEnoughLiquidity)
                            && swap.isCrossExchangeAvailable
                            && swap.bestCrossExchangeRoute !== undefined
                        ):
                            return (
                                <button
                                    type="button"
                                    className="btn btn-xs btn-secondary swap-price__exchange-mode-btn"
                                    disabled={swap.isSwapping}
                                    onClick={swap.toggleSwapExchangeMode}
                                >
                                    {intl.formatMessage({
                                        // eslint-disable-next-line no-nested-ternary
                                        id: !swap.isEnoughLiquidity
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
                {swap.priceDirection === SwapDirection.RTL ? (
                    <span
                        key={SwapDirection.RTL}
                        dangerouslySetInnerHTML={{
                            __html: intl.formatMessage({
                                id: 'SWAP_PRICE_RESULT',
                            }, {
                                value: swap.priceLeftToRight !== undefined
                                    ? formattedAmount(
                                        swap.priceLeftToRight || '0',
                                        swap.leftToken.decimals,
                                    )
                                    : '--',
                                leftSymbol: swap.leftToken.symbol,
                                rightSymbol: swap.rightToken.symbol,
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
                                value: swap.priceRightToLeft !== undefined
                                    ? formattedAmount(
                                        swap.priceRightToLeft || '0',
                                        swap.rightToken.decimals,
                                    )
                                    : '--',
                                leftSymbol: swap.rightToken.symbol,
                                rightSymbol: swap.leftToken.symbol,
                            }, {
                                ignoreTag: true,
                            }),
                        }}
                    />
                )}
                <button
                    type="button"
                    className="btn form-row__btn swap-price__reverse-btn"
                    onClick={onClickReverse}
                >
                    <Icon icon="reverseHorizontal" />
                </button>
            </div>
        </div>
    )
}

export const SwapPrice = observer(Price)
