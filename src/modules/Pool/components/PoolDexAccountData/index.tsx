import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { usePoolStore } from '@/modules/Pool/stores/PoolStore'
import { formattedTokenAmount } from '@/utils'


export function PoolDexAccountData(): JSX.Element {
    const intl = useIntl()
    const pool = usePoolStore()

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
        <Observer>
            {() => {
                if (!pool.isDexAccountDataAvailable) {
                    return null
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
                                        <Button
                                            type="icon"
                                            title="Withdraw"
                                            onClick={onWithdrawLeftToken}
                                        >
                                            {pool.isWithdrawingLeftToken ? (
                                                <Icon icon="loader" ratio={0.6} className="spin" />
                                            ) : (
                                                <Icon icon="push" ratio={0.7} />
                                            )}
                                        </Button>
                                    )}
                                </div>
                                <div className="list-bill__val">
                                    {formattedTokenAmount(pool.dexLeftBalance, pool.leftToken.decimals)}
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
                                        <Button
                                            type="icon"
                                            title="Withdraw"
                                            onClick={onWithdrawRightToken}
                                        >
                                            {pool.isWithdrawingRightToken ? (
                                                <Icon icon="loader" ratio={0.6} className="spin" />
                                            ) : (
                                                <Icon icon="push" ratio={0.7} />
                                            )}
                                        </Button>
                                    )}
                                </div>
                                <div className="list-bill__val">
                                    {formattedTokenAmount(pool.dexRightBalance, pool.rightToken.decimals)}
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
                                        <Button
                                            key="withdrawLp"
                                            type="icon"
                                            title="Withdraw"
                                            onClick={onWithdrawLpToken}
                                        >
                                            {pool.isWithdrawingLiquidity ? (
                                                <Icon icon="loader" ratio={0.6} className="spin" />
                                            ) : (
                                                <Icon icon="push" ratio={0.7} />
                                            )}
                                        </Button>
                                    )}
                                    {pool.isWithdrawLiquidityAvailable && (
                                        <Button
                                            key="withdrawLiquidity"
                                            type="icon"
                                            title="Withdraw Liquidity"
                                            onClick={onWithdrawLiquidity}
                                        >
                                            {pool.isWithdrawingLiquidity ? (
                                                <Icon icon="loader" ratio={0.6} className="spin" />
                                            ) : (
                                                <Icon icon="remove" ratio={0.9} />
                                            )}
                                        </Button>
                                    )}
                                </div>
                                <div className="list-bill__val">
                                    {formattedTokenAmount(pool.lpWalletBalance, pool.lpDecimals)}
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
                                        value: formattedTokenAmount(pool.currentShareLeft, pool.leftToken?.decimals),
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
                                        value: formattedTokenAmount(pool.currentShareRight, pool.rightToken?.decimals),
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )
            }}
        </Observer>
    )
}
