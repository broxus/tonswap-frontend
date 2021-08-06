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
                    <NavLink to="/swap">
                        {intl.formatMessage({
                            id: 'NAV_LINK_TEXT_SWAP',
                        })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/pool">
                        {intl.formatMessage({
                            id: 'NAV_LINK_TEXT_POOL',
                        })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/tokens">
                        {intl.formatMessage({
                            id: 'NAV_LINK_TEXT_TOKENS',
                        })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/pairs">
                        {intl.formatMessage({
                            id: 'NAV_LINK_TEXT_PAIRS',
                        })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/farming">
                        {intl.formatMessage({
                            id: 'NAV_LINK_TEXT_FARMING',
                        })}
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/builder">
                        {intl.formatMessage({
                            id: 'NAV_LINK_TEXT_BUILDER',
                        })}
                    </NavLink>
                </li>
            </ul>
        </nav>
    )
}
