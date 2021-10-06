import * as React from 'react'

import { AccountConnector } from '@/modules/AccountConnector'
import { WalletConnector } from '@/modules/WalletConnector'
import { FarmingItem } from '@/modules/Farming/components/FarmingItem'

import './index.scss'

export function Farming(): JSX.Element {
    return (
        <div className="section section--large">
            <WalletConnector>
                <AccountConnector>
                    <FarmingItem />
                </AccountConnector>
            </WalletConnector>
        </div>
    )
}
