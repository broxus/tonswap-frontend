import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { usePool } from '@/modules/Pool/stores/PoolStore'
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
                        <AccountExplorerLink address={dex.address} />
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
                        <AccountExplorerLink address={pool.lpRoot} />
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
                        <AccountExplorerLink address={pool.pairAddress} />
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export const PoolRootsInfo = observer(RootsInfo)
