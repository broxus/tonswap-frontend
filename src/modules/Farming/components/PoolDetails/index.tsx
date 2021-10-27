import * as React from 'react'
import { useIntl } from 'react-intl'
import BigNumber from 'bignumber.js'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { PoolForm } from '@/modules/Farming/components/PoolForm'
import { FarmPool } from '@/modules/Farming/types'
import { formattedAmount } from '@/utils'

import './index.scss'


type Props = {
    pool: FarmPool;
}

export function PoolDetails({ pool }: Props): JSX.Element {
    const intl = useIntl()

    return (
        <div
            key="pool-details"
            className="farming-pool-details"
        >
            <h3 className="farming-pool-details-title">
                {intl.formatMessage({
                    id: 'FARMING_LIST_POOL_DETAILS_HEADER_TITLE',
                }, { symbol: pool.tokenSymbol })}
            </h3>
            <div className="farming-pool-details-table">
                <h4 className="farming-pool-details-subtitle">
                    {intl.formatMessage({
                        id: 'FARMING_LIST_POOL_DETAILS_HEADER_SUBTITLE',
                    })}
                </h4>
                <div className="farming-pool-details-table__row">
                    <div>
                        {intl.formatMessage({
                            id: 'FARMING_LIST_POOL_DETAILS_FARM_BALANCE',
                        }, {
                            symbol: pool.tokenSymbol,
                        })}
                    </div>
                    <div>
                        {formattedAmount(
                            pool.tokenBalance,
                            pool.tokenDecimals,
                        ) || 0}
                    </div>
                </div>
                {pool.rewardTokenSymbol.map((symbol, idx) => (
                    <React.Fragment key={symbol}>
                        <div className="farming-pool-details-table__row">
                            <div>
                                {intl.formatMessage({
                                    id: 'FARMING_LIST_POOL_DETAILS_FARM_SPEED',
                                }, {
                                    symbol,
                                })}
                            </div>
                            <div>
                                {formattedAmount(
                                    pool.farmSpeed[idx],
                                    pool.rewardTokenDecimals[idx],
                                ) || 0}
                            </div>
                        </div>
                        <div className="farming-pool-details-table__row">
                            <div>
                                {intl.formatMessage({
                                    id: 'FARMING_LIST_POOL_DETAILS_REWARD_BALANCE',
                                }, {
                                    symbol,
                                })}
                            </div>
                            <div>
                                {formattedAmount(
                                    pool.rewardTokenBalance[idx],
                                    pool.rewardTokenDecimals[idx],
                                ) || 0}
                            </div>
                        </div>
                    </React.Fragment>
                ))}
                <div className="farming-pool-details-table__row">
                    <div>
                        {intl.formatMessage({
                            id: 'FARMING_LIST_POOL_DETAILS_FARM_START',
                        })}
                    </div>
                    <div>
                        {intl.formatDate(pool.farmStart, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hourCycle: 'h23',
                        })}
                    </div>
                </div>
                {pool.farmEnd && (
                    <>
                        <div className="farming-pool-details-table__row">
                            <div>
                                {intl.formatMessage({
                                    id: 'FARMING_LIST_POOL_DETAILS_FARM_END',
                                })}
                            </div>
                            <div>
                                {intl.formatDate(pool.farmEnd, {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hourCycle: 'h23',
                                })}
                            </div>
                        </div>
                    </>
                )}
                <div className="farming-pool-details-table__row">
                    <div>
                        {intl.formatMessage({
                            id: 'FARMING_LIST_POOL_DETAILS_VESTING_RATIO',
                        })}
                    </div>
                    <div>
                        {new BigNumber(pool.vestingRatio).div(10).decimalPlaces(1, BigNumber.ROUND_DOWN).toFixed()}
                    </div>
                </div>
                <div className="farming-pool-details-table__row">
                    <div>
                        {intl.formatMessage({
                            id: 'FARMING_LIST_POOL_DETAILS_VESTING_PERIOD',
                        })}
                    </div>
                    <div>
                        {new BigNumber(pool.vestingPeriod).div(86400).decimalPlaces(0, BigNumber.ROUND_DOWN).toFixed()}
                    </div>
                </div>
                <div className="farming-pool-details-table__row">
                    <div>
                        {intl.formatMessage({
                            id: 'FARMING_LIST_POOL_DETAILS_POOL_ADDRESS',
                        })}
                    </div>
                    <div>
                        <AccountExplorerLink address={pool.address} />
                    </div>
                </div>
                <div className="farming-pool-details-table__row">
                    <div>
                        {intl.formatMessage({
                            id: 'FARMING_LIST_POOL_DETAILS_OWNER_ADDRESS',
                        })}
                    </div>
                    <div>
                        <AccountExplorerLink address={pool.owner} />
                    </div>
                </div>
                <div className="farming-pool-details-table__row">
                    <div>
                        {intl.formatMessage({
                            id: 'FARMING_LIST_POOL_DETAILS_FARM_TOKEN_ROOT',
                        })}
                    </div>
                    <div>
                        <AccountExplorerLink address={pool.tokenRoot} />
                    </div>
                </div>
                {pool.rewardTokenSymbol.map((symbol, idx) => (
                    <React.Fragment key={symbol}>
                        <div className="farming-pool-details-table__row">
                            <div>
                                {intl.formatMessage({
                                    id: 'FARMING_LIST_POOL_DETAILS_REWARD_TOKEN',
                                }, {
                                    symbol,
                                })}
                            </div>
                            <div>
                                <AccountExplorerLink address={pool.rewardTokenRoot[idx]} />
                            </div>
                        </div>
                    </React.Fragment>
                ))}

                {pool.userDataDeployed && (
                    <>
                        <hr className="divider" style={{ marginBottom: 0 }} />
                        <h4 className="farming-pool-details-subtitle">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_USER_DETAILS_HEADER_SUBTITLE',
                            })}
                        </h4>
                        <div className="farming-pool-details-table__row">
                            <div>
                                {intl.formatMessage({
                                    id: 'FARMING_LIST_USER_DETAILS_FARM_USER_BALANCE',
                                }, {
                                    symbol: pool.tokenSymbol,
                                })}
                            </div>
                            <div>
                                {formattedAmount(
                                    pool.userBalance,
                                    pool.tokenDecimals,
                                ) || 0}
                            </div>
                        </div>
                        {pool.rewardTokenSymbol.map((symbol, idx) => (
                            <div key={symbol}>
                                <div className="farming-pool-details-table__row">
                                    <div>
                                        {intl.formatMessage({
                                            id: 'FARMING_LIST_USER_DETAILS_FARM_USER_UNCLAIMED_REWARD',
                                        }, {
                                            symbol,
                                        })}
                                    </div>
                                    <div>
                                        {formattedAmount(
                                            pool.userReward?._vested[idx],
                                            pool.rewardTokenDecimals[idx],
                                        ) || 0}
                                    </div>
                                </div>
                                <div className="farming-pool-details-table__row">
                                    <div>
                                        {intl.formatMessage({
                                            id: 'FARMING_LIST_USER_DETAILS_FARM_USER_UNCLAIMED_REWARD_DEBT',
                                        }, {
                                            symbol,
                                        })}
                                    </div>
                                    <div>
                                        {formattedAmount(
                                            pool.userReward?._pool_debt[idx],
                                            pool.rewardTokenDecimals[idx],
                                        ) || 0}
                                    </div>
                                </div>
                                <div className="farming-pool-details-table__row">
                                    <div>
                                        {intl.formatMessage({
                                            id: 'FARMING_LIST_USER_DETAILS_FARM_USER_UNCLAIMED_REWARD_ENTITLED',
                                        }, {
                                            symbol,
                                        })}
                                    </div>
                                    <div>
                                        {formattedAmount(
                                            pool.userReward?._entitled[idx],
                                            pool.rewardTokenDecimals[idx],
                                        ) || 0}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {pool.userReward?._vesting_time !== '0' && (
                            <>
                                <div className="farming-pool-details-table__row">
                                    <div>
                                        {intl.formatMessage({
                                            id: 'FARMING_LIST_USER_DETAILS_FARM_USER_UNCLAIMED_VESTING_TIME',
                                        })}
                                    </div>
                                    <div>
                                        {intl.formatDate(parseInt(pool.userReward?._vesting_time || '0', 10) * 1000, {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hourCycle: 'h23',
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="farming-pool-details-table__row">
                            <div>
                                {intl.formatMessage({
                                    id: 'FARMING_LIST_USER_DETAILS_FARM_CONTRACT_ADDRESS',
                                })}
                            </div>
                            <div>
                                <AccountExplorerLink address={pool.userDataAddress} />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <PoolForm pool={pool} />
        </div>
    )
}
