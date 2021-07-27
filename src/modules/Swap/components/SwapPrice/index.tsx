import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { DEFAULT_DECIMALS } from '@/modules/Swap/constants'
import { useSwap } from '@/modules/Swap/stores/SwapStore'
import { SwapDirection } from '@/modules/Swap/types'
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

    return (wallet.address && swap.leftToken && swap.rightToken) ? (
        <div className="form-row">
            <div>
                {intl.formatMessage({
                    id: 'SWAP_PRICE_LABEL',
                })}
            </div>
            <div>
                {swap.priceDirection === SwapDirection.RTL ? (
                    <span
                        key={SwapDirection.RTL}
                        dangerouslySetInnerHTML={{
                            __html: intl.formatMessage({
                                id: 'SWAP_PRICE_RESULT',
                            }, {
                                value: swap.priceLeftToRight
                                    ? formatBalance(
                                        swap.priceLeftToRight || '0',
                                        swap.priceDecimalsLeft ?? DEFAULT_DECIMALS,
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
                                value: swap.priceRightToLeft
                                    ? formatBalance(
                                        swap.priceRightToLeft || '0',
                                        swap.priceDecimalsRight ?? DEFAULT_DECIMALS,
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
                    className="btn form-row__btn swap-price-reverse__btn"
                    onClick={onClickReverse}
                >
                    <Icon icon="reverseHorizontal" />
                </button>
            </div>
        </div>
    ) : null
}

export const SwapPrice = observer(Price)
