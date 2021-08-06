import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { ContentLoader } from '@/components/common/ContentLoader'
import { Item } from '@/modules/Farming/components/PoolsList/Item'
import { FarmPool } from '@/modules/Farming/types'

import './index.scss'


type Props = {
    isLoading: boolean;
    pools: FarmPool[];
}


export function PoolsList({ isLoading, pools }: Props): JSX.Element {
    const intl = useIntl()

    return (
        <Observer>
            {() => (
                <div className="farming-list list">
                    <div className="list__header">
                        <div className="list__cell list__cell--left">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_TOKEN_CELL',
                            })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_TVL_CELL',
                            })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_APY_CELL',
                            })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_HEADER_REWARD_CELL',
                            })}
                        </div>
                        <div className="list__cell list__cell--right">
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

                    {isLoading
                        ? <ContentLoader />
                        : pools.map(pool => (
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
