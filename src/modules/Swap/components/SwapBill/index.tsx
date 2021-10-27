import * as React from 'react'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { TokenCache } from '@/stores/TokensCacheService'
import { formattedAmount } from '@/utils'

type Props = {
    fee?: string;
    isCrossExchangeAvailable: boolean;
    isCrossExchangeMode: boolean;
    leftToken?: TokenCache;
    minExpectedAmount?: string;
    priceImpact?: string;
    rightToken?: TokenCache;
    slippage?: string;
    tokens?: TokenCache[];
}


export function SwapBill({
    fee,
    isCrossExchangeAvailable,
    isCrossExchangeMode,
    leftToken,
    minExpectedAmount,
    priceImpact,
    rightToken,
    slippage,
    tokens,
}: Props): JSX.Element | null {
    const intl = useIntl()

    if (leftToken === undefined || rightToken === undefined) {
        return null
    }

    return (
        <div className="list-bill">
            {(isCrossExchangeMode && isCrossExchangeAvailable && tokens !== undefined && tokens.length > 0) && (
                <div key="route" className="list-bill__row">
                    <div className="list-bill__info">
                        <span>
                            {intl.formatMessage({
                                id: 'SWAP_BILL_LABEL_ROUTE',
                            })}
                        </span>
                        <span className="list-bill__icn">
                            <Icon icon="info" />
                        </span>
                    </div>
                    <div className="list-bill__val">
                        <ul className="breadcrumb" style={{ margin: 0 }}>
                            <li>
                                <span>{leftToken.symbol}</span>
                            </li>
                            {tokens?.map(token => (
                                <li key={token.root}>
                                    <span>{token.symbol}</span>
                                </li>
                            ))}
                            <li>
                                <span>{rightToken.symbol}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {(slippage !== undefined && minExpectedAmount !== undefined) && (
                <div key="slippage" className="list-bill__row">
                    <div className="list-bill__info">
                        <span>
                            {intl.formatMessage({
                                id: 'SWAP_BILL_LABEL_SLIPPAGE',
                            })}
                        </span>
                        <span className="list-bill__icn">
                            <Icon icon="info" />
                        </span>
                    </div>
                    <div className="list-bill__val">
                        {slippage}
                        %
                    </div>
                </div>
            )}

            {minExpectedAmount !== undefined && (
                <div key="minExpectedAmount" className="list-bill__row">
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
                                value: formattedAmount(minExpectedAmount, rightToken.decimals) || 0,
                                symbol: rightToken.symbol || '',
                            }, {
                                ignoreTag: true,
                            }),
                        }}
                    />
                </div>
            )}

            {priceImpact !== undefined && (
                <div key="priceImpact" className="list-bill__row">
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
                                value: priceImpact || 0,
                            }, {
                                ignoreTag: true,
                            }),
                        }}
                    />
                </div>
            )}

            {fee !== undefined && (
                <div key="fee" className="list-bill__row">
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
                                value: formattedAmount(fee, leftToken.decimals) || 0,
                                symbol: leftToken.symbol || '',
                            }, {
                                ignoreTag: true,
                            }),
                        }}
                    />
                </div>
            )}
        </div>
    )
}
