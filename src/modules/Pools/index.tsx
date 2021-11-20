import * as React from 'react'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'

import { SectionTitle } from '@/components/common/SectionTitle'
import { PoolsContent } from '@/modules/Pools/components/PoolsContent'
import { WalletConnector } from '@/modules/WalletConnector'
import { AccountConnector } from '@/modules/AccountConnector'

import './style.scss'

export function Pools(): JSX.Element {
    const intl = useIntl()

    return (
        <div className="container container--large">
            <section className="section">
                <div className="section__header section__header_wrap">
                    <SectionTitle>
                        {intl.formatMessage({ id: 'POOLS_LIST_TITLE' })}
                    </SectionTitle>

                    <div className="section__header-actions">
                        <Link to="/pools/burn-liquidity" className="btn btn-secondary">
                            {intl.formatMessage({ id: 'POOLS_LIST_HEADER_REMOVE' })}
                        </Link>

                        <Link to="/pool" className="btn btn-primary">
                            {intl.formatMessage({ id: 'POOLS_LIST_HEADER_NEW' })}
                        </Link>
                    </div>
                </div>
                <WalletConnector
                    message={intl.formatMessage({ id: 'POOLS_LIST_CONNECT_WALLET_TITLE' })}
                >
                    <AccountConnector>
                        <PoolsContent />
                    </AccountConnector>
                </WalletConnector>
            </section>
        </div>
    )
}
