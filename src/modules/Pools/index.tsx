import * as React from 'react'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'

import { SectionTitle } from '@/components/common/SectionTitle'
import { PoolsContent } from '@/modules/Pools/components/PoolsContent'
import { WalletConnector } from '@/modules/Pools/components/WalletConnector'
import { AccountConnector } from '@/modules/Pools/components/AccountConnector'

import './style.scss'

export function Pools(): JSX.Element {
    const intl = useIntl()

    return (
        <div className="section section--large">
            <div className="section__header">
                <SectionTitle>
                    {intl.formatMessage({ id: 'POOLS_LIST_TITLE' })}
                </SectionTitle>

                <Link to="/pool" className="btn btn-primary">
                    {intl.formatMessage({ id: 'POOLS_LIST_HEADER_BUTTON' })}
                </Link>
            </div>
            <WalletConnector>
                <AccountConnector>
                    <PoolsContent />
                </AccountConnector>
            </WalletConnector>
        </div>
    )
}
