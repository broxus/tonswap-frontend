import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useSwap } from '@/modules/Swap/stores/SwapStore'
import { amount } from '@/utils'


function Bill(): JSX.Element | null {
    const intl = useIntl()
    const swap = useSwap()

    return (swap.minExpectedAmount && swap.priceImpact && swap.fee) ? (
        <div className="list-bill">
            <div className="list-bill__row">
                <div className="list-bill__info">
                    <span>
                        {intl.formatMessage({
                            id: 'SWAP_BILL_LABEL_MINIMUM_RECEIVE',
                        })}
                    </span>
                    <span className="list-bill__icn">
                        <Icon icon="info" />
                    </span>
                </div>
                <div
                    className="list-bill__val"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'SWAP_BILL_RESULT_MINIMUM_RECEIVE',
                        }, {
                            value: amount(
                                swap.minExpectedAmount,
                                swap.rightToken?.decimals,
                            ) || '0',
                            symbol: swap.rightToken?.symbol ?? '',
                        }, {
                            ignoreTag: true,
                        }),
                    }}
                />
            </div>
            <div className="list-bill__row">
                <div className="list-bill__info">
                    <span>
                        {intl.formatMessage({
                            id: 'SWAP_BILL_LABEL_PRICE_IMPACT',
                        })}
                    </span>
                    <span className="list-bill__icn">
                        <Icon icon="info" />
                    </span>
                </div>
                <div
                    className="list-bill__val"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'SWAP_BILL_RESULT_PRICE_IMPACT',
                        }, {
                            value: swap.priceImpact,
                        }, {
                            ignoreTag: true,
                        }),
                    }}
                />
            </div>
            <div className="list-bill__row">
                <div className="list-bill__info">
                    <span>
                        {intl.formatMessage({
                            id: 'SWAP_BILL_LABEL_FEE',
                        })}
                    </span>
                    <span className="list-bill__icn">
                        <Icon icon="info" />
                    </span>
                </div>
                <div
                    className="list-bill__val"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'SWAP_BILL_RESULT_FEE',
                        }, {
                            value: amount(
                                swap.fee,
                                swap.leftToken?.decimals,
                            ) || '0',
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
