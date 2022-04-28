import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { TransactionExplorerLink } from '@/components/common/TransactionExplorerLink'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { formattedTokenAmount } from '@/utils'


function SwapReceipt(): JSX.Element | null {
    const intl = useIntl()
    const formStore = useSwapFormStore()

    if (formStore.transaction == null) {
        return null
    }

    const actions = (
        <div key="actions" className="popup-actions">
            {(formStore.transaction.isCrossExchangeCanceled && formStore.transaction.spentRoot !== undefined) && (
                <AccountExplorerLink
                    key="crossPair"
                    address={formStore.transaction.spentRoot}
                    className="btn btn-secondary"
                >
                    {intl.formatMessage({
                        id: 'SWAP_TRANSACTION_RECEIPT_LINK_TXT_TOKEN_ROOT_CONTRACT',
                    })}
                </AccountExplorerLink>
            )}

            {(!formStore.transaction.isCrossExchangeCanceled && formStore.transaction.receivedRoot !== undefined) && (
                <AccountExplorerLink
                    key="directPair"
                    address={formStore.transaction.receivedRoot}
                    className="btn btn-secondary"
                >
                    {intl.formatMessage({
                        id: 'SWAP_TRANSACTION_RECEIPT_LINK_TXT_TOKEN_ROOT_CONTRACT',
                    })}
                </AccountExplorerLink>
            )}
            {formStore.transaction.hash !== undefined && (
                <TransactionExplorerLink
                    id={formStore.transaction.hash}
                    className="btn btn-secondary"
                >
                    {intl.formatMessage({
                        id: 'SWAP_TRANSACTION_RECEIPT_LINK_TXT_TRANSACTION',
                    })}
                </TransactionExplorerLink>
            )}
        </div>
    )
    const receivedToken = (
        <div key="receivedToken" className="popup-main nb np">
            {formStore.transaction.isCrossExchangeCanceled ? (
                <div key="crossExchangeIcon" className="popup-main__ava">
                    {formStore.transaction.spentIcon !== undefined
                        ? (
                            <img
                                alt={formStore.transaction.spentSymbol}
                                src={formStore.transaction.spentIcon}
                            />
                        )
                        : formStore.transaction.spentRoot !== undefined && (
                            <UserAvatar
                                address={formStore.transaction.spentRoot}
                            />
                        )}
                </div>
            ) : (
                <div key="directIcon" className="popup-main__ava">
                    {formStore.transaction.receivedIcon !== undefined
                        ? (
                            <img
                                alt={formStore.transaction.receivedSymbol}
                                src={formStore.transaction.receivedIcon}
                            />
                        )
                        : formStore.transaction.receivedRoot !== undefined && (
                            <UserAvatar
                                address={formStore.transaction.receivedRoot}
                            />
                        )}
                </div>
            )}

            <div
                className="popup-main__name"
                dangerouslySetInnerHTML={{
                    __html: intl.formatMessage({
                        id: 'SWAP_TRANSACTION_RECEIPT_LEAD_RECEIVED_AMOUNT',
                    }, {
                        value: formattedTokenAmount(
                            formStore.transaction.amount,
                            formStore.transaction.isCrossExchangeCanceled
                                ? formStore.transaction.spentDecimals
                                : formStore.transaction.receivedDecimals,
                            { preserve: true },
                        ),
                        symbol:
                            formStore.transaction.isCrossExchangeCanceled
                                ? formStore.transaction.spentSymbol
                                : formStore.transaction.receivedSymbol,
                    }, {
                        ignoreTag: true,
                    }),
                }}
            />
        </div>
    )

    return ReactDOM.createPortal(
        <div className="popup">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <Button
                    type="icon"
                    className="popup-close"
                    onClick={formStore.cleanTransactionResult}
                >
                    <Icon icon="close" />
                </Button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: formStore.transaction.success
                            ? 'SWAP_TRANSACTION_RECEIPT_POPUP_TITLE_SUCCESS'
                            : 'SWAP_TRANSACTION_RECEIPT_POPUP_TITLE_FAILURE',
                    })}
                </h2>
                {formStore.transaction.success ? (
                    <>
                        {receivedToken}
                        {actions}
                    </>
                ) : (
                    <>
                        <div
                            key="failureText"
                            className="popup-txt"
                            dangerouslySetInnerHTML={{
                                __html: intl.formatMessage({
                                    id: formStore.transaction.isCrossExchangeCanceled
                                        ? 'SWAP_TRANSACTION_RECEIPT_CROSS_EXCHANGE_CANCELLED_NOTE'
                                        : 'SWAP_TRANSACTION_RECEIPT_CANCELLED_NOTE',
                                }, {
                                    leftSymbol: formStore.transaction.spentSymbol,
                                    rightSymbol: formStore.transaction.receivedSymbol,
                                    slippage: formStore.transaction.slippage,
                                }),
                            }}
                        />
                        {formStore.transaction.isCrossExchangeCanceled && receivedToken}
                        {actions}
                    </>
                )}
            </div>
        </div>,
        document.body,
    )
}

export const SwapTransactionReceipt = observer(SwapReceipt)
