import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { PoolContent } from '@/modules/Pools/components/PoolContent'
import { WalletConnector } from '@/modules/WalletConnector'
import { AccountConnector } from '@/modules/AccountConnector'

import './style.scss'

export const PoolsItem = observer((): JSX.Element => {
    const intl = useIntl()

    return (
        <div className="container container--large">
            <WalletConnector
                message={intl.formatMessage({ id: 'POOLS_LIST_CONNECT_WALLET_TITLE' })}
            >
                <AccountConnector>
                    <PoolContent />
                </AccountConnector>
            </WalletConnector>
        </div>
    )
})
