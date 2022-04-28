import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { TransactionExplorerLink } from '@/components/common/TransactionExplorerLink'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { formattedTokenAmount } from '@/utils'


function ConversionReceipt(): JSX.Element | null {
    const intl = useIntl()
    const formStore = useSwapFormStore()

    if (formStore.conversion.txHash === undefined) {
        return null
    }

    const onClose = () => {
        formStore.conversion.setData({
            wrappedAmount: undefined,
            txHash: undefined,
            unwrappedAmount: undefined,
        })
    }

    return ReactDOM.createPortal(
        <div className="popup">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <Button
                    type="icon"
                    className="popup-close"
                    onClick={onClose}
                >
                    <Icon icon="close" />
                </Button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: formStore.isWrapMode
                            ? 'WRAP_RECEIPT_POPUP_TITLE_SUCCESS'
                            : 'UNWRAP_RECEIPT_POPUP_TITLE_SUCCESS',
                    })}
                </h2>
                <div className="popup-main nb np">
                    <div className="popup-main__ava">
                        {formStore.isWrapMode ? (
                            <TokenIcon
                                address={formStore.conversion.token?.root}
                                icon={formStore.conversion.token?.icon}
                            />
                        ) : (
                            <TokenIcon
                                icon={formStore.conversion.coin?.icon}
                            />
                        )}
                    </div>

                    <div
                        className="popup-main__name"
                        dangerouslySetInnerHTML={{
                            __html: intl.formatMessage({
                                id: 'CONVERSION_RECEIPT_LEAD_RECEIVED_AMOUNT',
                            }, {
                                value: formattedTokenAmount(
                                    formStore.isWrapMode
                                        ? formStore.conversion.wrappedAmount
                                        : formStore.conversion.unwrappedAmount,
                                    formStore.isWrapMode
                                        ? formStore.conversion.token?.decimals
                                        : formStore.conversion.coin?.decimals,
                                    { preserve: true },
                                ),
                                symbol:
                                    formStore.isWrapMode
                                        ? formStore.conversion.token?.symbol
                                        : formStore.conversion.coin?.symbol,
                            }, {
                                ignoreTag: true,
                            }),
                        }}
                    />
                </div>
                <div className="popup-actions">
                    {formStore.isWrapMode && formStore.conversion.token?.root !== undefined && (
                        <AccountExplorerLink
                            key="directPair"
                            address={formStore.conversion.token?.root}
                            className="btn btn-secondary"
                        >
                            {intl.formatMessage({
                                id: 'CONVERSION_RECEIPT_LINK_TXT_TOKEN_ROOT_CONTRACT',
                            })}
                        </AccountExplorerLink>
                    )}
                    <TransactionExplorerLink
                        id={formStore.conversion.txHash}
                        className="btn btn-secondary"
                    >
                        {intl.formatMessage({
                            id: 'CONVERSION_RECEIPT_LINK_TXT_TRANSACTION',
                        })}
                    </TransactionExplorerLink>
                </div>
            </div>
        </div>,
        document.body,
    )
}

export const ConversionTransactionReceipt = observer(ConversionReceipt)
