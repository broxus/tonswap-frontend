import * as React from 'react'
import classNames from 'classnames'

import { Component } from '@/components/common/Component'
import type { PolymorphicComponentProps } from '@/components/common/Component'


export interface NavbarContainerOwnProps extends React.HTMLAttributes<HTMLElement> {
    transparent?: boolean;
}

export type NavbarContainerProps<
    E extends React.ElementType = React.ElementType
> = PolymorphicComponentProps<E, NavbarContainerOwnProps>


const defaultElement = 'div'

export function Container<E extends React.ElementType = typeof defaultElement>(
    props: NavbarContainerProps<E>,
): JSX.Element {
    const {
        className,
        transparent,
        ...restProps
    } = props

    return (
        <Component
            className={classNames('navbar-container', {
                'navbar-transparent': transparent,
            }, className)}
            component={defaultElement}
            {...restProps}
        />
    )
}


if (process.env.NODE_ENV !== 'production') {
    Container.displayName = 'Navbar.Container'
}
