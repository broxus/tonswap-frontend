import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useSwap } from '@/modules/Swap/stores/SwapStore'
import { SwapTransactionProp } from '@/modules/Swap/types'
import { formatBalance } from '@/utils'


type Props = {
    onDismiss(): void;
}


function Transaction({ onDismiss }: Props): JSX.Element | null {
    const intl = useIntl()
    const swap = useSwap()

    if (swap.transaction == null) {
        return null
    }

    return (
        <div className="popup">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <button
                    type="button"
                    className="btn popup-close"
                    onClick={onDismiss}
                >
                    <Icon icon="close" />
                </button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'SWAP_TRANSACTION_RECEIPT_POPUP_TITLE',
                    })}
                </h2>
                {swap.transaction[SwapTransactionProp.SUCCESS] ? (
                    <>
                        <div className="popup-main">
                            <div className="popup-main__ava">
                                {swap.transaction[SwapTransactionProp.RECEIVED_ICON] ? (
                                    <img
                                        alt={swap.transaction[SwapTransactionProp.RECEIVED_SYMBOL]}
                                        src={swap.transaction[SwapTransactionProp.RECEIVED_ICON]}
                                    />
                                ) : swap.transaction[SwapTransactionProp.RECEIVED_ROOT] && (
                                    <UserAvatar
                                        address={swap.transaction[SwapTransactionProp.RECEIVED_ROOT] as string}
                                    />
                                )}
                            </div>
                            <div
                                className="popup-main__name"
                                style={{
                                    maxWidth: 238,
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: intl.formatMessage({
                                        id: 'SWAP_TRANSACTION_RECEIPT_LEAD_SUCCESSFUL_AMOUNT',
                                    }, {
                                        value: formatBalance(
                                            swap.transaction[SwapTransactionProp.RECEIVED_AMOUNT] || '0',
                                            swap.transaction[SwapTransactionProp.RECEIVED_DECIMALS],
                                        ),
                                        symbol: swap.transaction[SwapTransactionProp.RECEIVED_SYMBOL],
                                    }, {
                                        ignoreTag: true,
                                    }),
                                }}
                            />
                        </div>
                        <div
                            className="popup-txt"
                            dangerouslySetInnerHTML={{
                                __html: intl.formatMessage({
                                    id: 'SWAP_TRANSACTION_RECEIPT_SUCCESSFUL_NOTE',
                                }, {
                                    symbol: swap.transaction[SwapTransactionProp.RECEIVED_SYMBOL],
                                    address: swap.transaction[SwapTransactionProp.RECEIVED_ROOT],
                                    transactionHash: swap.transaction[SwapTransactionProp.HASH],
                                }, {
                                    ignoreTag: true,
                                }),
                            }}
                        />
                    </>
                ) : (
                    <>
                        <div className="popup-main">
                            <div className="popup-main__ava error" />
                            <div className="popup-main__name">
                                {intl.formatMessage({
                                    id: 'SWAP_TRANSACTION_RECEIPT_LEAD_CANCELLED',
                                })}
                            </div>
                        </div>
                        <div
                            className="popup-txt"
                            dangerouslySetInnerHTML={{
                                __html: intl.formatMessage({
                                    id: 'SWAP_TRANSACTION_RECEIPT_CANCELLED_NOTE',
                                }),
                            }}
                        />
                    </>
                )}
                <button
                    type="button"
                    className="btn btn-light btn-block popup-btn"
                    onClick={onDismiss}
                >
                    {intl.formatMessage({
                        id: 'SWAP_TRANSACTION_RECEIPT_BTN_TEXT_CLOSE',
                    })}
                </button>
            </div>
        </div>
    )
}

export const SwapTransaction = observer(Transaction)
