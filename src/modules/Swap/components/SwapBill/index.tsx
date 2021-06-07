import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useSwap } from '@/modules/Swap/stores/SwapStore'
import { formatBalance } from '@/utils'

import './index.scss'


function Bill(): JSX.Element | null {
    const intl = useIntl()
    const swap = useSwap()

    return (swap.minExpectedAmount && swap.priceImpact && swap.fee) ? (
        <div className="swap-bill">
            <div className="swap-bill__row">
                <div className="swap-bill__info">
                    <span>
                        {intl.formatMessage({
                            id: 'SWAP_BILL_MINIMUM_RECEIVE',
                        })}
                    </span>
                    <span className="swap-bill__icn">
                        <Icon icon="info" />
                    </span>
                </div>
                <div
                    className="swap-bill__val"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'SWAP_BILL_MINIMUM_RECEIVE_RESULT',
                        }, {
                            value: formatBalance(
                                swap.minExpectedAmount ?? '0',
                                swap.rightToken?.decimals,
                            ),
                            symbol: swap.rightToken?.symbol ?? '',
                        }, {
                            ignoreTag: true,
                        }),
                    }}
                />
            </div>
            <div className="swap-bill__row">
                <div className="swap-bill__info">
                    <span>
                        {intl.formatMessage({
                            id: 'SWAP_TRANSACTION_RECEIPT_TITLE',
                        })}
                    </span>
                    <span className="swap-bill__icn">
                        <Icon icon="info" />
                    </span>
                </div>
                <div
                    className="swap-bill__val"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'SWAP_BILL_PRICE_IMPACT_RESULT',
                        }, {
                            value: swap.priceImpact,
                        }, {
                            ignoreTag: true,
                        }),
                    }}
                />
            </div>
            <div className="swap-bill__row">
                <div className="swap-bill__info">
                    <span>
                        {intl.formatMessage({
                            id: 'SWAP_BILL_FEE',
                        })}
                    </span>
                    <span className="swap-bill__icn">
                        <Icon icon="info" />
                    </span>
                </div>
                <div
                    className="swap-bill__val"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'SWAP_BILL_FEE_RESULT',
                        }, {
                            value: formatBalance(
                                swap.fee ?? '0',
                                swap.leftToken?.decimals,
                            ),
                            symbol: swap.leftToken?.symbol ?? '',
                        }, {
                            ignoreTag: true,
                        }),
                    }}
                />
            </div>
        </div>
    ) : null
}

export const SwapBill = observer(Bill)
