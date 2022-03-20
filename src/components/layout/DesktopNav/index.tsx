import * as React from 'react'
import { useIntl } from 'react-intl'
import { NavLink } from 'react-router-dom'

import { Nav } from '@/components/common/Nav'
import { Navbar } from '@/components/common/Navbar'

import './index.scss'


export function DesktopNav(): JSX.Element {
    const intl = useIntl()

    return (
        <Navbar.Nav className="desktop-nav flex-wrap width-expand">
            <Nav.Item key="swap">
                <NavLink to="/swap">
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_SWAP',
                    })}
                </NavLink>
            </Nav.Item>
            <Nav.Item key="pools">
                <NavLink
                    to="/pools"
                    isActive={(_, location) => location.pathname.indexOf('/pool') === 0}
                >
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_POOLS',
                    })}
                </NavLink>
            </Nav.Item>
            <Nav.Item key="tokens">
                <NavLink to="/tokens">
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_TOKENS',
                    })}
                </NavLink>
            </Nav.Item>
            <Nav.Item key="pairs">
                <NavLink to="/pairs">
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_PAIRS',
                    })}
                </NavLink>
            </Nav.Item>
            <Nav.Item key="farming">
                <NavLink to="/farming">
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_FARMING',
                    })}
                </NavLink>
            </Nav.Item>
            <Nav.Item key="builder">
                <NavLink to="/builder">
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_BUILDER',
                    })}
                </NavLink>
            </Nav.Item>
        </Navbar.Nav>
    )
}
