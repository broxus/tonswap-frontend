import * as React from 'react'
import classNames from 'classnames'

import { Component } from '@/components/common/Component'
import type { PolymorphicComponentProps } from '@/components/common/Component'


export type NavbarCenterProps<E extends React.ElementType = React.ElementType> = PolymorphicComponentProps<E, unknown>


const defaultElement = 'div'

export function Center<E extends React.ElementType = typeof defaultElement>(
    props: NavbarCenterProps<E>,
): JSX.Element {
    const { className, ...restProps } = props

    return (
        <Component
            className={classNames(
                'navbar-center',
                className,
            )}
            component={defaultElement}
            {...restProps}
        />
    )
}


if (process.env.NODE_ENV !== 'production') {
    Center.displayName = 'Navbar.Center'
}
