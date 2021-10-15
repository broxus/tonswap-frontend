import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { usePool } from '@/modules/Pool/stores/PoolStore'
import { Icon } from '@/components/common/Icon'
import { UserAvatar } from '@/components/common/UserAvatar'
import { formattedAmount } from '@/utils'


type Props = {
    onDismiss: () => void;
}


function DepositLiquidityTransaction({ onDismiss }: Props): JSX.Element | null {
    const intl = useIntl()
    const pool = usePool()

    return pool.transaction ? ReactDOM.createPortal(
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
                        id: 'POOL_SUPPLY_RECEIPT_POPUP_TITLE',
                    })}
                </h2>
                {(pool.transaction.success && pool.transaction.successData) ? (
                    <>
                        <div className="popup-main">
                            <div className="popup-main__ava">
                                <UserAvatar
                                    address={pool.transaction.successData.lpRoot}
                                />
                            </div>
                            <div
                                className="popup-main__name"
                                dangerouslySetInnerHTML={{
                                    __html: intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_LEAD_SUCCESSFUL_AMOUNT',
                                    }, {
                                        value: formattedAmount(
                                            pool.transaction.successData.share || '0',
                                            pool.transaction.successData.lpDecimals,
                                        ),
                                    }, {
                                        ignoreTag: true,
                                    }),
                                }}
                            />
                        </div>
                        <div className="form-rows">
                            <div className="form-row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_SUBTITLE_RESULT',
                                    })}
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_DATA_LABEL_SHARE_PERCENT',
                                    })}
                                </div>
                                <div>
                                    {intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_DATA_RESULT_SHARE_PERCENT',
                                    }, {
                                        value: pool.transaction.successData.sharePercent,
                                    })}
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_DATA_LABEL_SHARE_CHANGE_PERCENT',
                                    })}
                                </div>
                                <div>
                                    {intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_DATA_RESULT_SHARE_CHANGE_PERCENT',
                                    }, {
                                        value: pool.transaction.successData.shareChangePercent,
                                    })}
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    {pool.transaction.successData.leftSymbol}
                                </div>
                                <div>
                                    {formattedAmount(
                                        pool.transaction.successData.newLeft,
                                        pool.transaction.successData.leftDecimals,
                                    )}
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    {pool.transaction.successData.rightSymbol}
                                </div>
                                <div>
                                    {formattedAmount(
                                        pool.transaction.successData.newRight,
                                        pool.transaction.successData.rightDecimals,
                                    )}
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_DATA_LABEL_NEW_LEFT_PRICE',
                                    }, {
                                        leftSymbol: pool.transaction.successData.leftSymbol,
                                        rightSymbol: pool.transaction.successData.rightSymbol,
                                    })}
                                </div>
                                <div>
                                    {pool.transaction.successData.newLeftPrice}
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_DATA_LABEL_NEW_RIGHT_PRICE',
                                    }, {
                                        leftSymbol: pool.transaction.successData.leftSymbol,
                                        rightSymbol: pool.transaction.successData.rightSymbol,
                                    })}
                                </div>
                                <div>
                                    {pool.transaction.successData.newRightPrice}
                                </div>
                            </div>
                        </div>
                        <hr className="divider" />
                        <div
                            className="popup-txt"
                            dangerouslySetInnerHTML={{
                                __html: intl.formatMessage({
                                    id: 'POOL_SUPPLY_RECEIPT_SUCCESSFUL_NOTE',
                                }, {
                                    address: pool.transaction.successData.lpRoot,
                                    transactionHash: pool.transaction.successData.hash,
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
                            <div
                                className="popup-main__name"
                                dangerouslySetInnerHTML={{
                                    __html: intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_LEAD_CANCELLED',
                                    }),
                                }}
                            />
                        </div>
                        <div
                            className="popup-txt"
                            dangerouslySetInnerHTML={{
                                __html: intl.formatMessage({
                                    id: 'POOL_SUPPLY_RECEIPT_CANCELLED_NOTE',
                                }),
                            }}
                        />
                    </>
                )}
                <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={onDismiss}
                >
                    {intl.formatMessage({
                        id: 'POOL_SUPPLY_RECEIPT_POPUP_BTN_TEXT_CLOSE',
                    })}
                </button>
            </div>
        </div>,
        document.body,
    ) : null
}

export const PoolDepositLiquidityTransaction = observer(DepositLiquidityTransaction)
