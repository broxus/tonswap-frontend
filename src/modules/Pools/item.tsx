import * as React from 'react'
import { observer } from 'mobx-react-lite'

import { PoolContent } from '@/modules/Pools/components/PoolContent'
import { WalletConnector } from '@/modules/Pools/components/WalletConnector'
import { AccountConnector } from '@/modules/Pools/components/AccountConnector'

import './style.scss'

export const PoolsItem = observer((): JSX.Element => (
    <div className="section section--large">
        <WalletConnector>
            <AccountConnector>
                <PoolContent />
            </AccountConnector>
        </WalletConnector>
    </div>
))
