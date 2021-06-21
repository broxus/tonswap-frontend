import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { usePool } from '@/modules/Pool/stores/PoolStore'


function ShareData(): JSX.Element {
    const intl = useIntl()
    const pool = usePool()

    return (
        <>
            <hr className="divider" />
            <div className="form-rows">
                <div className="form-row">
                    <div>
                        {intl.formatMessage({
                            id: 'POOL_DATA_SUBTITLE_AFTER_SUPPLY',
                        })}
                    </div>
                </div>

                {pool.sharePercent && (
                    <div key="sharePercent" className="form-row">
                        <div>
                            {intl.formatMessage({
                                id: 'POOL_DATA_LABEL_SHARE_PERCENT',
                            })}
                        </div>
                        <div>
                            {intl.formatMessage({
                                id: 'POOL_DATA_RESULT_SHARE_PERCENT',
                            }, {
                                value: pool.sharePercent,
                            })}
                        </div>
                    </div>
                )}

                {pool.shareChangePercent && (
                    <div key="shareChangePercent" className="form-row">
                        <div>
                            {intl.formatMessage({
                                id: 'POOL_DATA_LABEL_SHARE_CHANGE_PERCENT',
                            })}
                        </div>
                        <div>
                            {intl.formatMessage({
                                id: 'POOL_DATA_RESULT_SHARE_CHANGE_PERCENT',
                            }, {
                                value: pool.shareChangePercent,
                            })}
                        </div>
                    </div>
                )}

                {pool.newLeftPrice && (
                    <div key="newLeftPrice" className="form-row">
                        <div>
                            {intl.formatMessage({
                                id: 'POOL_DATA_LABEL_NEW_LEFT_PRICE',
                            }, {
                                leftSymbol: pool.leftToken?.symbol,
                                rightSymbol: pool.rightToken?.symbol,
                            })}
                        </div>
                        <div>
                            {pool.newLeftPrice}
                        </div>
                    </div>
                )}

                {pool.newRightPrice && (
                    <div key="newRightPrice" className="form-row">
                        <div>
                            {intl.formatMessage({
                                id: 'POOL_DATA_LABEL_NEW_RIGHT_PRICE',
                            }, {
                                leftSymbol: pool.leftToken?.symbol,
                                rightSymbol: pool.rightToken?.symbol,
                            })}
                        </div>
                        <div>
                            {pool.newRightPrice}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export const PoolShareData = observer(ShareData)
