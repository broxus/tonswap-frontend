import * as React from 'react'
import classNames from 'classnames'

import { Component } from '@/components/common/Component'
import type { PolymorphicComponentProps } from '@/components/common/Component'


export type NavbarLeftProps<E extends React.ElementType = React.ElementType> = PolymorphicComponentProps<E, unknown>


const defaultElement = 'div'

export function Left<E extends React.ElementType = typeof defaultElement>(
    props: NavbarLeftProps<E>,
): JSX.Element {
    const { className, ...restProps } = props

    return (
        <Component
            className={classNames(
                'navbar-left',
                className,
            )}
            component={defaultElement}
            {...restProps}
        />
    )
}


if (process.env.NODE_ENV !== 'production') {
    Left.displayName = 'Navbar.Left'
}
