import * as React from 'react'
import classNames from 'classnames'

import { Nav as BaseNav } from '@/components/common/Nav'
import type { NavProps } from '@/components/common/Nav'


export function Nav(props: NavProps): JSX.Element {
    const { className, ...restProps } = props

    return (
        <BaseNav
            className={classNames('navbar-nav', className)}
            popupPrefixCls="navbar-dropdown"
            {...restProps}
            mode="horizontal"
        />
    )
}


if (process.env.NODE_ENV !== 'production') {
    Nav.displayName = 'Navbar.Nav'
}
