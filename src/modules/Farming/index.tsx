import * as React from 'react'
import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'

import { SectionTitle } from '@/components/common/SectionTitle'
import { WalletConnector } from '@/modules/WalletConnector'
import { FarmingList } from '@/modules/Farming/components/FarmingList'
import { appRoutes } from '@/routes'

import './index.scss'

export function Farmings(): JSX.Element {
    const intl = useIntl()

    return (
        <div className="section section--large">
            <div className="section__header">
                <SectionTitle>
                    {intl.formatMessage({
                        id: 'FARMING_LIST_TITLE',
                    })}
                </SectionTitle>
                <Link
                    className="btn btn-primary"
                    to={appRoutes.farmingCreate.path}
                >
                    {intl.formatMessage({
                        id: 'FARMING_LIST_CREATE_BTN',
                    })}
                </Link>
            </div>

            <WalletConnector>
                <FarmingList />
            </WalletConnector>
        </div>
    )
}
