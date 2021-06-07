import * as React from 'react'
import { useIntl } from 'react-intl'
import { NavLink } from 'react-router-dom'

import './index.scss'


export function Nav(): JSX.Element {
    const intl = useIntl()

    return (
        <nav className="main-nav">
            <ul>
                <li>
                    <NavLink
                        activeClassName="active"
                        to="/swap"
                    >
                        {intl.formatMessage({
                            id: 'NAV_LINK_SWAP_TEXT',
                        })}
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        activeClassName="active"
                        to="/pool"
                    >
                        {intl.formatMessage({
                            id: 'NAV_LINK_POOL_TEXT',
                        })}
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        activeClassName="active"
                        to="/tokens"
                    >
                        {intl.formatMessage({
                            id: 'NAV_LINK_TOKENS_TEXT',
                        })}
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        activeClassName="active"
                        to="/pairs"
                    >
                        {intl.formatMessage({
                            id: 'NAV_LINK_PAIRS_TEXT',
                        })}
                    </NavLink>
                </li>
            </ul>
        </nav>
    )
}
