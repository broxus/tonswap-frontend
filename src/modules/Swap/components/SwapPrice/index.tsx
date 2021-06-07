import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { SwapPriceDirection, useSwap } from '@/modules/Swap/stores/SwapStore'
import { useWallet } from '@/stores/WalletService'
import { formatBalance } from '@/utils'

import './index.scss'


function Price(): JSX.Element | null {
    const intl = useIntl()
    const swap = useSwap()
    const wallet = useWallet()

    const onClickReverse = () => {
        swap.togglePriceDirection()
    }

    return (wallet.address && swap.pair && swap.leftToken && swap.rightToken) ? (
        <div className="swap-form-row">
            <div>Price</div>
            <div>
                {swap.priceDirection === SwapPriceDirection.RTL && (
                    <span
                        dangerouslySetInnerHTML={{
                            __html: intl.formatMessage({
                                id: 'SWAP_PRICE_VALUE',
                            }, {
                                value: swap.priceLeftToRight
                                    ? formatBalance(
                                        swap.priceLeftToRight ?? '0',
                                        swap.priceDecimalsLeft ?? 18,
                                    )
                                    : '--',
                                leftSymbol: swap.leftToken.symbol ?? '',
                                rightSymbol: swap.rightToken.symbol ?? '',
                            }, {
                                ignoreTag: true,
                            }),
                        }}
                    />
                )}
                {swap.priceDirection === SwapPriceDirection.LTR && (
                    <span
                        dangerouslySetInnerHTML={{
                            __html: intl.formatMessage({
                                id: 'SWAP_PRICE_VALUE',
                            }, {
                                value: swap.priceRightToLeft
                                    ? formatBalance(
                                        swap.priceRightToLeft ?? '0',
                                        swap.priceDecimalsRight ?? 18,
                                    )
                                    : '--',
                                leftSymbol: swap.rightToken.symbol ?? '',
                                rightSymbol: swap.leftToken.symbol ?? '',
                            }, {
                                ignoreTag: true,
                            }),
                        }}
                    />
                )}
                <button
                    type="button"
                    className="btn swap-form-row__btn swap-form-price-reverse__btn"
                    onClick={onClickReverse}
                >
                    <Icon icon="reverseHorizontal" />
                </button>
            </div>
        </div>
    ) : null
}

export const SwapPrice = observer(Price)
