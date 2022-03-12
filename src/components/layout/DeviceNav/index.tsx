import * as React from 'react'
import { useIntl } from 'react-intl'
import { NavLink } from 'react-router-dom'

import { Nav } from '@/components/common/Nav'

import './index.scss'

type Props = {
    onNavigate?: () => void;
}


export function DeviceNav({ onNavigate }: Props): JSX.Element {
    const intl = useIntl()

    return (
        <Nav className="device-nav" modifiers={['divider']}>
            <Nav.Item>
                <NavLink to="/swap" onClick={onNavigate}>
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_SWAP',
                    })}
                </NavLink>
            </Nav.Item>
            <Nav.Item>
                <NavLink
                    to="/pools"
                    isActive={(_, location) => location.pathname.indexOf('/pool') === 0}
                    onClick={onNavigate}
                >
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_POOLS',
                    })}
                </NavLink>
            </Nav.Item>
            <Nav.Item>
                <NavLink to="/tokens" onClick={onNavigate}>
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_TOKENS',
                    })}
                </NavLink>
            </Nav.Item>
            <Nav.Item>
                <NavLink to="/pairs" onClick={onNavigate}>
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_PAIRS',
                    })}
                </NavLink>
            </Nav.Item>
            <Nav.Item>
                <NavLink to="/farming" onClick={onNavigate}>
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_FARMING',
                    })}
                </NavLink>
            </Nav.Item>
            <Nav.Item>
                <NavLink to="/builder" onClick={onNavigate}>
                    {intl.formatMessage({
                        id: 'NAV_LINK_TEXT_BUILDER',
                    })}
                </NavLink>
            </Nav.Item>
        </Nav>
    )
}
