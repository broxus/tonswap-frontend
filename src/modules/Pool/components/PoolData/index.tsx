import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { usePoolStore } from '@/modules/Pool/stores/PoolStore'
import { formattedTokenAmount } from '@/utils'


export function PoolData(): JSX.Element {
    const intl = useIntl()
    const pool = usePoolStore()

    return (
        <Observer>
            {() => (
                <div className="form-rows">
                    <div className="form-row">
                        <div>
                            {intl.formatMessage({
                                id: 'POOL_DATA_SUBTITLE_CURRENT_STATE',
                            })}
                        </div>
                    </div>
                    <div className="form-row">
                        <div>
                            {pool.leftToken?.symbol}
                        </div>
                        <div>
                            {formattedTokenAmount(
                                pool.pairBalances?.left,
                                pool.leftToken?.decimals,
                            )}
                        </div>
                    </div>
                    <div className="form-row">
                        <div>
                            {pool.rightToken?.symbol}
                        </div>
                        <div>
                            {formattedTokenAmount(
                                pool.pairBalances?.right,
                                pool.rightToken?.decimals,
                            )}
                        </div>
                    </div>
                    <div className="form-row">
                        <div>
                            {intl.formatMessage({
                                id: 'POOL_DATA_LABEL_LP_SUPPLY',
                            })}
                        </div>
                        <div>
                            {formattedTokenAmount(
                                pool.pairBalances?.lp,
                                pool.lpDecimals,
                            )}
                        </div>
                    </div>
                    <div className="form-row">
                        <div>
                            {intl.formatMessage({
                                id: 'POOL_DATA_LABEL_LEFT_PRICE',
                            }, {
                                leftSymbol: pool.leftToken?.symbol,
                                rightSymbol: pool.rightToken?.symbol,
                            })}
                        </div>
                        <div>
                            {formattedTokenAmount(pool.leftPrice)}
                        </div>
                    </div>
                    <div className="form-row">
                        <div>
                            {intl.formatMessage({
                                id: 'POOL_DATA_LABEL_RIGHT_PRICE',
                            }, {
                                leftSymbol: pool.leftToken?.symbol,
                                rightSymbol: pool.rightToken?.symbol,
                            })}
                        </div>
                        <div>
                            {formattedTokenAmount(pool.rightPrice)}
                        </div>
                    </div>
                    <div className="form-row">
                        <div>
                            {intl.formatMessage({
                                id: 'POOL_DATA_LABEL_FEE',
                            })}
                        </div>
                        <div>0.3%</div>
                    </div>
                </div>
            )}
        </Observer>
    )
}
