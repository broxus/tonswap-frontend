import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { usePool } from '@/modules/Pool/stores/PoolStore'
import { sliceAddress } from '@/utils'
import { useDexAccount } from '@/stores/DexAccountService'


function RootsInfo(): JSX.Element {
    const intl = useIntl()
    const dex = useDexAccount()
    const pool = usePool()

    return (
        <div className="list-bill">
            {dex.address ? (
                <div key="dexAddress" className="list-bill__row">
                    <div className="list-bill__info">
                        <span>
                            {intl.formatMessage({
                                id: 'POOL_ROOTS_INFO_LABEL_DEX_ADDRESS',
                            })}
                        </span>
                    </div>
                    <div className="list-bill__val">
                        <a
                            href={`https://ton-explorer.com/accounts/${dex.address}`}
                            title="Open in explorer"
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                        >
                            {sliceAddress(dex.address)}
                        </a>
                    </div>
                </div>
            ) : null}
            {pool.lpRoot ? (
                <div key="lpRoot" className="list-bill__row">
                    <div className="list-bill__info">
                        <span>
                            {intl.formatMessage({
                                id: 'POOL_ROOTS_INFO_LABEL_LP_ROOT',
                            })}
                        </span>
                    </div>
                    <div className="list-bill__val">
                        <a
                            href={`https://ton-explorer.com/accounts/${pool.lpRoot}`}
                            title="Open in explorer"
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                        >
                            {sliceAddress(pool.lpRoot)}
                        </a>
                    </div>
                </div>
            ) : null}
            {pool.pairAddress ? (
                <div key="pairRoot" className="list-bill__row">
                    <div className="list-bill__info">
                        <span>
                            {intl.formatMessage({
                                id: 'POOL_ROOTS_INFO_LABEL_PAIR_ROOT',
                            })}
                        </span>
                    </div>
                    <div className="list-bill__val">
                        <a
                            href={`https://ton-explorer.com/accounts/${pool.pairAddress}`}
                            title="Open in explorer"
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                        >
                            {sliceAddress(pool.pairAddress)}
                        </a>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export const PoolRootsInfo = observer(RootsInfo)
