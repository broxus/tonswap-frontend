import * as React from 'react'
import classNames from 'classnames'

import { Component } from '@/components/common/Component'
import type { PolymorphicComponentProps } from '@/components/common/Component'


export type NavbarToggleProps<E extends React.ElementType = React.ElementType> = PolymorphicComponentProps<E, {
    icon?: boolean;
}>


const defaultElement = 'div'

export function Toggle<E extends React.ElementType = typeof defaultElement>(
    props: NavbarToggleProps<E>,
): JSX.Element {
    const {
        className,
        icon = false,
        ...restProps
    } = props

    return (
        <Component
            className={classNames('navbar-toggle', {
                'navbar-toggle-icon': icon,
            }, className)}
            component={defaultElement}
            {...restProps}
        />
    )
}


if (process.env.NODE_ENV !== 'production') {
    Toggle.displayName = 'Navbar.Toggle'
}
