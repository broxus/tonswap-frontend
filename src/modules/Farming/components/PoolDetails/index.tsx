import * as React from 'react'
import { useIntl } from 'react-intl'

import { PoolForm } from '@/modules/Farming/components/PoolForm'
import { FarmPool } from '@/modules/Farming/types'
import { amount, sliceAddress } from '@/utils'

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
                        {amount(
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
                                {amount(
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
                                {amount(
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
                            hour: 'numeric',
                            hour12: false,
                            minute: 'numeric',
                        })}
                    </div>
                </div>
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
                            hour: 'numeric',
                            hour12: false,
                            minute: 'numeric',
                        })}
                    </div>
                </div>
                <div className="farming-pool-details-table__row">
                    <div>
                        {intl.formatMessage({
                            id: 'FARMING_LIST_POOL_DETAILS_POOL_ADDRESS',
                        })}
                    </div>
                    <div>
                        <a
                            href={`https://ton-explorer.com/accounts/${pool.address}`}
                            title="Open in explorer"
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                        >
                            {sliceAddress(pool.address)}
                        </a>
                    </div>
                </div>
                <div className="farming-pool-details-table__row">
                    <div>
                        {intl.formatMessage({
                            id: 'FARMING_LIST_POOL_DETAILS_OWNER_ADDRESS',
                        })}
                    </div>
                    <div>
                        <a
                            href={`https://ton-explorer.com/accounts/${pool.owner}`}
                            title="Open in explorer"
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                        >
                            {sliceAddress(pool.owner)}
                        </a>
                    </div>
                </div>
                <div className="farming-pool-details-table__row">
                    <div>
                        {intl.formatMessage({
                            id: 'FARMING_LIST_POOL_DETAILS_FARM_TOKEN_ROOT',
                        })}
                    </div>
                    <div>
                        <a
                            href={`https://ton-explorer.com/accounts/${pool.tokenRoot}`}
                            title="Open in explorer"
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                        >
                            {sliceAddress(pool.tokenRoot)}
                        </a>
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
                                <a
                                    href={`https://ton-explorer.com/accounts/${pool.rewardTokenRoot[idx]}`}
                                    title="Open in explorer"
                                    target="_blank"
                                    rel="nofollow noopener noreferrer"
                                >
                                    {sliceAddress(pool.rewardTokenRoot[idx])}
                                </a>
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
                                {amount(
                                    pool.userBalance,
                                    pool.tokenDecimals,
                                ) || 0}
                            </div>
                        </div>
                        {pool.rewardTokenSymbol.map((symbol, idx) => (
                            <div key={symbol} className="farming-pool-details-table__row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'FARMING_LIST_USER_DETAILS_FARM_USER_UNCLAIMED_REWARD',
                                    }, {
                                        symbol,
                                    })}
                                </div>
                                <div>
                                    {amount(
                                        pool.userReward[idx],
                                        pool.rewardTokenDecimals[idx],
                                    ) || 0}
                                </div>
                            </div>
                        ))}
                        <div className="farming-pool-details-table__row">
                            <div>
                                {intl.formatMessage({
                                    id: 'FARMING_LIST_USER_DETAILS_FARM_CONTRACT_ADDRESS',
                                })}
                            </div>
                            <div>
                                <a
                                    href={`https://ton-explorer.com/accounts/${pool.userDataAddress}`}
                                    title="Open in explorer"
                                    target="_blank"
                                    rel="nofollow noopener noreferrer"
                                >
                                    {sliceAddress(pool.userDataAddress)}
                                </a>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <PoolForm pool={pool} />
        </div>
    )
}
