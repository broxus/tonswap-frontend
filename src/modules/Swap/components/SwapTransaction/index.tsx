import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useSwap } from '@/modules/Swap/stores/SwapStore'
import { formatBalance } from '@/utils'


type Props = {
    onClose(): void;
}


function Transaction({ onClose }: Props): JSX.Element | null {
    const intl = useIntl()
    const swap = useSwap()

    return swap.transaction ? (
        <div className="swap-popup">
            <div className="swap-popup-overlay" />
            <div className="swap-popup__wrap">
                <button
                    type="button"
                    className="btn swap-popup-close"
                    onClick={onClose}
                >
                    <Icon icon="close" />
                </button>
                <h2 className="swap-popup-title">
                    {intl.formatMessage({
                        id: 'SWAP_TRANSACTION_RECEIPT_TITLE',
                    })}
                </h2>
                {swap.transaction.success ? (
                    <>
                        <div className="swap-popup-main">
                            <div className="swap-popup-main__ava">
                                {swap.transaction.receivedIcon ? (
                                    <img
                                        alt={swap.transaction.receivedSymbol}
                                        src={swap.transaction.receivedIcon}
                                    />
                                ) : swap.transaction.receivedRoot && (
                                    <UserAvatar
                                        address={swap.transaction.receivedRoot}
                                    />
                                )}
                            </div>
                            <div
                                className="swap-popup-main__name"
                                style={{
                                    maxWidth: 238,
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: intl.formatMessage({
                                        id: 'SWAP_TRANSACTION_RECEIPT_SUCCESSFUL_AMOUNT',
                                    }, {
                                        value: formatBalance(
                                            swap.transaction.receivedAmount ?? '0',
                                            swap.transaction.receivedDecimals,
                                        ),
                                        symbol: swap.transaction.receivedSymbol,
                                    }, {
                                        ignoreTag: true,
                                    }),
                                }}
                            />
                        </div>
                        <div
                            className="swap-popup-txt"
                            dangerouslySetInnerHTML={{
                                __html: intl.formatMessage({
                                    id: 'SWAP_TRANSACTION_RECEIPT_SUCCESSFUL_NOTE',
                                }, {
                                    symbol: swap.transaction.receivedSymbol,
                                    address: swap.transaction.receivedRoot,
                                    transactionHash: swap.transaction.transactionHash,
                                }, {
                                    ignoreTag: true,
                                }),
                            }}
                        />
                    </>
                ) : (
                    <>
                        <div className="swap-popup-main">
                            <div className="swap-popup-main__ava error" />
                            <div className="swap-popup-main__name">
                                {intl.formatMessage({
                                    id: 'SWAP_TRANSACTION_RECEIPT_CANCELLED_TITLE',
                                })}
                            </div>
                        </div>
                        <div
                            className="swap-popup-txt"
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
                    className="btn btn-light btn-block swap-popup-btn"
                    onClick={onClose}
                >
                    {intl.formatMessage({
                        id: 'SWAP_TRANSACTION_RECEIPT_BTN_CLOSE_TEXT',
                    })}
                </button>
            </div>
        </div>
    ) : null
}

export const SwapTransaction = observer(Transaction)
