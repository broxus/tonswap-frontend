import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useCreateTokenStore } from '@/modules/Builder/stores/CreateTokenStore'
import { CreateTokenTransactionProp } from '@/modules/Builder/types'


type Props = {
    onDismiss(): void;
}


function Transaction({ onDismiss }: Props): JSX.Element | null {
    const intl = useIntl()
    const creatingToken = useCreateTokenStore()

    if (creatingToken.transaction == null) {
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
                        id: 'BUILDER_CREATE_TRANSACTION_RECEIPT_POPUP_TITLE',
                    })}
                </h2>
                {!creatingToken.transaction[CreateTokenTransactionProp.SUCCESS] ? (
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
                                    transactionHash: creatingToken.transaction[CreateTokenTransactionProp.HASH],
                                    address: creatingToken.transaction[CreateTokenTransactionProp.ROOT],
                                    name: creatingToken.transaction[CreateTokenTransactionProp.NAME],
                                    symbol: creatingToken.transaction[CreateTokenTransactionProp.SYMBOL],
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
                    className="btn btn-light btn-block popup-btn"
                    onClick={onDismiss}
                >
                    {intl.formatMessage({
                        id: 'BUILDER_CREATE_TRANSACTION_RECEIPT_BTN_TEXT_CLOSE',
                    })}
                </button>
            </div>
        </div>
    )
}

export const BuilderTransaction = observer(Transaction)
