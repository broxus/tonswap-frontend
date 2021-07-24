import * as React from 'react'
import classNames from 'classnames'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { UserAvatar } from '@/components/common/UserAvatar'
import { PoolDetails } from '@/modules/Farming/components/PoolDetails'
import { FarmPool } from '@/modules/Farming/types'
import { amount } from '@/utils'


type Props = {
    pool: FarmPool
}

export function Item({ pool }: Props): JSX.Element {
    const intl = useIntl()

    const [isExpand, setExpandTo] = React.useState(false)

    const toggleExpand = () => {
        setExpandTo(!isExpand)
    }

    return (
        <>
            <div className="farming-list__row">
                <div className="farming-list__trigger-cell" onClick={toggleExpand}>
                    <UserAvatar address={pool.tokenRoot} small />
                </div>
                <div className="farming-list__trigger-cell" onClick={toggleExpand}>
                    <h3 className="farming-list__token-name">
                        {pool.tokenSymbol}
                    </h3>
                    {pool.isExpired && (
                        <div key="expired" className="farming-list__token-status--expired">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_POOL_STATUS_EXPIRED',
                            })}
                        </div>
                    )}
                    {(!pool.isExpired && pool.isActive) && (
                        <div key="active" className="farming-list__token-status--active">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_POOL_STATUS_ACTIVE',
                            })}
                        </div>
                    )}
                    {(!pool.isExpired && !pool.isActive) && (
                        <div key="awaiting" className="farming-list__token-status--awaiting">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_POOL_STATUS_AWAITING',
                            })}
                        </div>
                    )}
                </div>
                <div className="farming-list__cell farming-list__cell--right">
                    $
                    {amount(pool.TVL, 0) || 0}
                </div>
                <div className="farming-list__cell farming-list__cell--right">
                    {amount(pool.APY, 0) || 0}
                    %
                </div>
                <Observer>
                    {() => (
                        <div className="farming-list__cell farming-list__cell--right">
                            {pool.userReward.map((reward, idx) => (
                                <div key={pool.rewardTokenSymbol[idx]}>
                                    {amount(
                                        reward,
                                        pool.rewardTokenDecimals[idx],
                                    ) || 0}
                                    {' '}
                                    {pool.rewardTokenSymbol[idx]}
                                </div>
                            ))}
                        </div>
                    )}
                </Observer>
                <div className="farming-list__cell farming-list__cell--right">
                    {amount(pool.userShare, 4) || 0}
                    %
                </div>
                <div
                    className={classNames([
                        'farming-list__cell',
                        'farming-list__cell--center',
                        'farming-list__trigger-cell',
                    ], {
                        'farming-list__cell--expanded': isExpand,
                    })}
                    onClick={toggleExpand}
                >
                    <UserAvatar address={pool.address} small />
                </div>
            </div>
            {isExpand && (
                <PoolDetails pool={pool} />
            )}
        </>
    )
}
