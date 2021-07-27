import * as React from 'react'
import { Observer } from 'mobx-react-lite'

import { UserAvatar } from '@/components/common/UserAvatar'
import { usePool } from '@/modules/Pool/stores/PoolStore'

import './index.scss'


export function PoolPairIcons(): JSX.Element | null {
    const pool = usePool()

    if (pool.leftToken?.root === pool.rightToken?.root) {
        return null
    }

    return (
        <Observer>
            {() => (
                <div className="pool-pair-icons">
                    {pool.leftToken?.icon ? (
                        <img
                            alt={pool.leftToken.symbol}
                            height={36}
                            src={pool.leftToken.icon}
                            width={36}
                        />
                    ) : pool.leftToken?.root && (
                        <UserAvatar address={pool.leftToken.root} />
                    )}
                    {pool.rightToken?.icon ? (
                        <img
                            alt={pool.rightToken.symbol}
                            height={36}
                            src={pool.rightToken.icon}
                            width={36}
                        />
                    ) : pool.rightToken?.root && (
                        <UserAvatar address={pool.rightToken.root} />
                    )}
                </div>
            )}
        </Observer>
    )
}
