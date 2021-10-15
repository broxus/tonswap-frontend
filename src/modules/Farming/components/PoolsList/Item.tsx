import * as React from 'react'
import classNames from 'classnames'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import BigNumber from 'bignumber.js'

import { UserAvatar } from '@/components/common/UserAvatar'
import { PoolDetails } from '@/modules/Farming/components/PoolDetails'
import { FarmPool } from '@/modules/Farming/types'
import { formattedAmount } from '@/utils'


type Props = {
    pool: FarmPool;
}

export function Item({ pool }: Props): JSX.Element {
    const intl = useIntl()

    const [isExpand, setExpandTo] = React.useState(false)

    const toggleExpand = () => {
        setExpandTo(!isExpand)
    }

    return (
        <>
            <div className="list__row">
                <div className="list__trigger-cell farming-list__trigger-cell" onClick={toggleExpand}>
                    <div className="list__cell-inner">
                        <div className="farming-list__token-icon-wrapper">
                            <UserAvatar address={pool.tokenRoot} size="small" />
                        </div>
                        <div>
                            <h3 className="farming-list__token-name">
                                {pool.tokenSymbol}
                            </h3>
                            {(pool.isActive && !pool.isExpired) && (
                                <div key="active" className="farming-list__token-status--active">
                                    {intl.formatMessage({
                                        id: 'FARMING_LIST_POOL_STATUS_ACTIVE',
                                    })}
                                </div>
                            )}
                            {(!pool.isActive) && (
                                <div key="awaiting" className="farming-list__token-status--awaiting">
                                    {intl.formatMessage({
                                        id: 'FARMING_LIST_POOL_STATUS_AWAITING',
                                    })}
                                </div>
                            )}
                            {(pool.isExpired) && (
                                <div key="expired" className="farming-list__token-status--awaiting">
                                    {intl.formatMessage({
                                        id: 'FARMING_LIST_POOL_STATUS_EXPIRED',
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="list__cell list__cell--right">
                    <div className="list__cell-inner-leader">
                        <div className="list__cell-inner-leader-term">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_TVL_CELL',
                            })}
                        </div>
                        <div className="list__cell-inner-leader-value">
                            $
                            {formattedAmount(pool.TVL, 0) || 0}
                        </div>
                    </div>
                </div>
                <div className="list__cell list__cell--right">
                    <div className="list__cell-inner-leader">
                        <div className="list__cell-inner-leader-term">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_APY_CELL',
                            })}
                        </div>
                        <div className="list__cell-inner-leader-value">
                            {formattedAmount(pool.APY, 0) || 0}
                            %
                        </div>
                    </div>
                </div>
                <Observer>
                    {() => (
                        <div className="list__cell list__cell--right">
                            <div className="list__cell-inner-leader">
                                <div className="list__cell-inner-leader-term">
                                    {intl.formatMessage({
                                        id: 'FARMING_LIST_HEADER_REWARD_CELL',
                                    })}
                                </div>
                                <div className="list__cell-inner-leader-value">
                                    {pool.userReward?._vested.map((reward, idx) => (
                                        <div key={pool.rewardTokenSymbol[idx]}>
                                            {formattedAmount(
                                                new BigNumber(reward).plus(pool.userReward?._pool_debt[idx] || '0').toFixed(),
                                                pool.rewardTokenDecimals[idx],
                                            ) || 0}
                                            {' '}
                                            {pool.rewardTokenSymbol[idx]}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </Observer>
                <div className="list__cell list__cell--right">
                    <div className="list__cell-inner-leader">
                        <div className="list__cell-inner-leader-term">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_SHARE_CELL',
                            })}
                        </div>
                        <div className="list__cell-inner-leader-value">
                            {formattedAmount(pool.userShare, 4) || 0}
                            %
                        </div>
                    </div>
                </div>
                <div
                    className={classNames([
                        'list__cell',
                        'farming-list__cell--pool',
                        'farming-list__trigger-cell',
                    ], {
                        'farming-list__cell--expanded': isExpand,
                    })}
                    onClick={toggleExpand}
                >
                    <div className="list__cell-inner-leader">
                        <div className="list__cell-inner-leader-value">
                            <UserAvatar address={pool.address} size="small" />
                        </div>
                    </div>
                </div>
            </div>

            {isExpand && (
                <PoolDetails pool={pool} />
            )}
        </>
    )
}
