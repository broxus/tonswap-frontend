import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Item } from '@/modules/Farming/components/PoolsList/Item'
import { useFarmingStore } from '@/modules/Farming/stores/FarmingStore'

import './index.scss'


export function PoolsList(): JSX.Element {
    const intl = useIntl()
    const farming = useFarmingStore()

    return (
        <Observer>
            {() => (
                <div className="farming-list">
                    <div className="farming-list__header">
                        <div>
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_TOKEN_CELL',
                            })}
                        </div>
                        <div className="farming-list__cell farming-list__cell--right">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_TVL_CELL',
                            })}
                        </div>
                        <div className="farming-list__cell farming-list__cell--right">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_APY_CELL',
                            })}
                        </div>
                        <div className="farming-list__cell farming-list__cell--right">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_REWARD_CELL',
                            })}
                        </div>
                        <div className="farming-list__cell farming-list__cell--right">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_SHARE_CELL',
                            })}
                        </div>
                        <div>
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_POOL_CELL',
                            })}
                        </div>
                    </div>
                    {farming.pools.map(pool => (
                        <Item
                            key={pool.address}
                            pool={pool}
                        />
                    ))}
                </div>
            )}
        </Observer>
    )
}
