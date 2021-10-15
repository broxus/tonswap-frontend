import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { usePool } from '@/modules/Pool/stores/PoolStore'
import { formattedAmount } from '@/utils'


function DexAccountData(): JSX.Element | null {
    const intl = useIntl()
    const pool = usePool()

    if (!pool.isDexAccountDataAvailable) {
        return null
    }

    const onWithdrawLeftToken = async () => {
        if (pool.leftToken && pool.dexLeftBalance) {
            await pool.withdrawToken(pool.leftToken.root, pool.dexLeftBalance)
        }
    }

    const onWithdrawRightToken = async () => {
        if (pool.rightToken && pool.dexRightBalance) {
            await pool.withdrawToken(pool.rightToken.root, pool.dexRightBalance)
        }
    }

    const onWithdrawLpToken = async () => {
        if (pool.lpRoot && pool.lpBalance) {
            await pool.withdrawToken(pool.lpRoot, pool.lpBalance)
        }
    }

    const onWithdrawLiquidity = async () => {
        await pool.withdrawLiquidity()
    }

    return (
        <div className="list-bill list-bill--pool">
            <div className="list-bill__row">
                <div className="list-bill__info">
                    {intl.formatMessage({
                        id: 'POOL_DATA_SUBTITLE_DEX_ACCOUNT',
                    })}
                </div>
            </div>

            {pool.leftToken && (
                <div key="dexLeftBalance" className="list-bill__row">
                    <div className="list-bill__info">
                        <span>
                            {pool.leftToken.symbol}
                        </span>
                        {pool.isLeftTokenWithdrawAvailable && (
                            <button
                                type="button"
                                className="btn btn-icon"
                                title="Withdraw"
                                onClick={onWithdrawLeftToken}
                            >
                                {pool.isWithdrawingLeftToken ? (
                                    <Icon icon="loader" ratio={0.6} className="spin" />
                                ) : (
                                    <Icon icon="push" ratio={0.7} />
                                )}
                            </button>
                        )}
                    </div>
                    <div className="list-bill__val">
                        {formattedAmount(pool.dexLeftBalance, pool.leftToken.decimals) || '0'}
                    </div>
                </div>
            )}

            {pool.rightToken && (
                <div key="dexRightBalance" className="list-bill__row">
                    <div className="list-bill__info">
                        <span>
                            {pool.rightToken.symbol}
                        </span>
                        {pool.isRightTokenWithdrawAvailable && (
                            <button
                                type="button"
                                className="btn btn-icon"
                                title="Withdraw"
                                onClick={onWithdrawRightToken}
                            >
                                {pool.isWithdrawingRightToken ? (
                                    <Icon icon="loader" ratio={0.6} className="spin" />
                                ) : (
                                    <Icon icon="push" ratio={0.7} />
                                )}
                            </button>
                        )}
                    </div>
                    <div className="list-bill__val">
                        {formattedAmount(pool.dexRightBalance, pool.rightToken.decimals) || '0'}
                    </div>
                </div>
            )}

            {pool.lpWalletBalance && (
                <div key="lpWalletBalance" className="list-bill__row">
                    <div className="list-bill__info">
                        <span>
                            {intl.formatMessage({
                                id: 'POOL_DEX_DATA_LABEL_LP_TOKENS',
                            })}
                        </span>
                        {pool.isWithdrawLpAvailable && (
                            <button
                                key="withdrawLp"
                                type="button"
                                className="btn btn-icon"
                                title="Withdraw"
                                onClick={onWithdrawLpToken}
                            >
                                {pool.isWithdrawingLiquidity ? (
                                    <Icon icon="loader" ratio={0.6} className="spin" />
                                ) : (
                                    <Icon icon="push" ratio={0.7} />
                                )}
                            </button>
                        )}
                        {pool.isWithdrawLiquidityAvailable && (
                            <button
                                key="withdrawLiquidity"
                                type="button"
                                className="btn btn-icon"
                                title="Withdraw Liquidity"
                                onClick={onWithdrawLiquidity}
                            >
                                {pool.isWithdrawingLiquidity ? (
                                    <Icon icon="loader" ratio={0.6} className="spin" />
                                ) : (
                                    <Icon icon="remove" ratio={0.9} />
                                )}
                            </button>
                        )}
                    </div>
                    <div className="list-bill__val">
                        {formattedAmount(pool.lpWalletBalance, pool.lpDecimals) || '0'}
                    </div>
                </div>
            )}

            {pool.currentSharePercent && (
                <div key="currentSharePercent" className="list-bill__row">
                    <div className="list-bill__info">
                        <span>
                            {intl.formatMessage({
                                id: 'POOL_DEX_DATA_LABEL_CURRENT_SHARE',
                            })}
                        </span>
                    </div>
                    <div className="list-bill__val">
                        {intl.formatMessage({
                            id: 'POOL_DEX_DATA_RESULT_CURRENT_SHARE',
                        }, {
                            value: pool.currentSharePercent,
                        })}
                    </div>
                </div>
            )}

            {pool.currentShareLeft && (
                <div key="currentShareLeft" className="list-bill__row">
                    <div className="list-bill__info"> </div>
                    <div className="list-bill__val">
                        {intl.formatMessage({
                            id: 'POOL_DEX_DATA_RESULT_CURRENT_SHARE_LEFT',
                        }, {
                            symbol: pool.leftToken?.symbol,
                            value: pool.currentShareLeft,
                        })}
                    </div>
                </div>
            )}

            {pool.currentShareRight && (
                <div key="currentShareRight" className="list-bill__row">
                    <div className="list-bill__info"> </div>
                    <div className="list-bill__val">
                        {intl.formatMessage({
                            id: 'POOL_DEX_DATA_RESULT_CURRENT_SHARE_RIGHT',
                        }, {
                            symbol: pool.rightToken?.symbol,
                            value: pool.currentShareRight,
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export const PoolDexAccountData = observer(DexAccountData)
