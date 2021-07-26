import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { usePool } from '@/modules/Pool/stores/PoolStore'
import { Icon } from '@/components/common/Icon'
import { SwapTransactionProp } from '@/modules/Swap/types'
import { UserAvatar } from '@/components/common/UserAvatar'
import { DepositLiquiditySuccessDataProp } from '@/modules/Pool/types'
import { formatBalance } from '@/utils'


type Props = {
    onDismiss(): void;
}


function DepositLiquidityTransaction({ onDismiss }: Props): JSX.Element | null {
    const intl = useIntl()
    const pool = usePool()

    return pool.transaction ? (
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
                                    address={(
                                        pool.transaction.successData[
                                            DepositLiquiditySuccessDataProp.LP_ROOT
                                        ]
                                    )}
                                />
                            </div>
                            <div
                                className="popup-main__name"
                                dangerouslySetInnerHTML={{
                                    __html: intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_LEAD_SUCCESSFUL_AMOUNT',
                                    }, {
                                        value: formatBalance(
                                            pool.transaction.successData[
                                                DepositLiquiditySuccessDataProp.SHARE
                                            ] || '0',
                                            pool.transaction.successData[
                                                DepositLiquiditySuccessDataProp.LP_DECIMALS
                                            ],
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
                                        value: (
                                            pool.transaction.successData[
                                                DepositLiquiditySuccessDataProp.SHARE_PERCENT
                                            ]
                                        ),
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
                                        value: (
                                            pool.transaction.successData[
                                                DepositLiquiditySuccessDataProp.SHARE_CHANGE_PERCENT
                                            ]
                                        ),
                                    })}
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    {pool.transaction.successData[
                                        DepositLiquiditySuccessDataProp.LEFT_SYMBOL
                                    ]}
                                </div>
                                <div>
                                    {formatBalance(
                                        pool.transaction.successData[DepositLiquiditySuccessDataProp.NEW_LEFT],
                                        pool.transaction.successData[DepositLiquiditySuccessDataProp.LEFT_DECIMALS],
                                    )}
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    {pool.transaction.successData[
                                        DepositLiquiditySuccessDataProp.RIGHT_SYMBOL
                                    ]}
                                </div>
                                <div>
                                    {formatBalance(
                                        pool.transaction.successData[DepositLiquiditySuccessDataProp.NEW_RIGHT],
                                        pool.transaction.successData[DepositLiquiditySuccessDataProp.RIGHT_DECIMALS],
                                    )}
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_DATA_LABEL_NEW_LEFT_PRICE',
                                    }, {
                                        leftSymbol: pool.transaction.successData[
                                            DepositLiquiditySuccessDataProp.LEFT_SYMBOL
                                        ],
                                        rightSymbol: pool.transaction.successData[
                                            DepositLiquiditySuccessDataProp.RIGHT_SYMBOL
                                        ],
                                    })}
                                </div>
                                <div>
                                    {pool.transaction.successData[
                                        DepositLiquiditySuccessDataProp.NEW_LEFT_PRICE
                                    ]}
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'POOL_SUPPLY_RECEIPT_DATA_LABEL_NEW_RIGHT_PRICE',
                                    }, {
                                        leftSymbol: pool.transaction.successData[
                                            DepositLiquiditySuccessDataProp.LEFT_SYMBOL
                                        ],
                                        rightSymbol: pool.transaction.successData[
                                            DepositLiquiditySuccessDataProp.RIGHT_SYMBOL
                                        ],
                                    })}
                                </div>
                                <div>
                                    {pool.transaction.successData[
                                        DepositLiquiditySuccessDataProp.NEW_RIGHT_PRICE
                                    ]}
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
                                    address: pool.transaction.successData[DepositLiquiditySuccessDataProp.LP_ROOT],
                                    transactionHash: pool.transaction.successData[SwapTransactionProp.HASH],
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
            </div>
        </div>
    ) : null
}

export const PoolDepositLiquidityTransaction = observer(DepositLiquidityTransaction)
