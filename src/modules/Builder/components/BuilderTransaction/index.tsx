import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useCreateTokenStore } from '@/modules/Builder/stores/CreateTokenStore'


type Props = {
    onDismiss: () => void;
}


function Transaction({ onDismiss }: Props): JSX.Element | null {
    const intl = useIntl()
    const creatingToken = useCreateTokenStore()

    if (creatingToken.transaction == null) {
        return null
    }

    return ReactDOM.createPortal(
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
                        id: 'BUILDER_CREATE_TRANSACTION_RECEIPT_POPUP_TITLE',
                    })}
                </h2>
                {creatingToken.transaction.success ? (
                    <>
                        <div className="popup-main">
                            <div className="popup-main__name">
                                {intl.formatMessage({
                                    id: 'BUILDER_CREATE_TRANSACTION_RECEIPT_TOKEN_DEPLOYED',
                                })}
                            </div>
                        </div>
                        <div
                            className="popup-txt"
                            dangerouslySetInnerHTML={{
                                __html: intl.formatMessage({
                                    id: 'BUILDER_CREATE_TRANSACTION_RECEIPT_SUCCESSFUL_NOTE',
                                }, {
                                    transactionHash: creatingToken.transaction.hash,
                                    address: creatingToken.transaction.root,
                                    name: creatingToken.transaction.name,
                                    symbol: creatingToken.transaction.symbol,
                                }, {
                                    ignoreTag: true,
                                }),
                            }}
                        />
                    </>
                ) : (
                    <div className="popup-main">
                        <div className="popup-main__ava error" />
                        <div className="popup-main__name">
                            {intl.formatMessage({
                                id: 'BUILDER_CREATE_TRANSACTION_RECEIPT_TOKEN_NOT_DEPLOYED',
                            })}
                        </div>
                    </div>
                )}
                <button
                    type="button"
                    className="btn btn-primary btn-block popup-btn"
                    onClick={onDismiss}
                >
                    {intl.formatMessage({
                        id: 'BUILDER_CREATE_TRANSACTION_RECEIPT_BTN_TEXT_CLOSE',
                    })}
                </button>
            </div>
        </div>,
        document.body,
    )
}

export const BuilderTransaction = observer(Transaction)
