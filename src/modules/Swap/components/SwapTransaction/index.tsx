import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useSwap } from '@/modules/Swap/stores/SwapStore'
import { amount } from '@/utils'


type Props = {
    onDismiss: () => void;
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
                    className="btn btn-icon popup-close"
                    onClick={onDismiss}
                >
                    <Icon icon="close" />
                </button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'SWAP_TRANSACTION_RECEIPT_POPUP_TITLE',
                    })}
                </h2>
                {swap.transaction.success ? (
                    <>
                        <div className="popup-main">
                            <div className="popup-main__ava">
                                {swap.transaction.receivedIcon ? (
                                    <img
                                        alt={swap.transaction.receivedSymbol}
                                        src={swap.transaction.receivedIcon}
                                    />
                                ) : swap.transaction.receivedRoot !== undefined && (
                                    <UserAvatar
                                        address={swap.transaction.receivedRoot}
                                    />
                                )}
                            </div>
                            <div
                                className="popup-main__name"
                                dangerouslySetInnerHTML={{
                                    __html: intl.formatMessage({
                                        id: 'SWAP_TRANSACTION_RECEIPT_LEAD_SUCCESSFUL_AMOUNT',
                                    }, {
                                        value: amount(
                                            swap.transaction.receivedAmount || '0',
                                            swap.transaction.receivedDecimals,
                                        ) || '0',
                                        symbol: swap.transaction.receivedSymbol,
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
                                    symbol: swap.transaction.receivedSymbol,
                                    address: swap.transaction.receivedRoot,
                                    transactionHash: swap.transaction.hash,
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
