import * as React from 'react'
import classNames from 'classnames'

import { Component } from '@/components/common/Component'
import type { PolymorphicComponentProps } from '@/components/common/Component'


export type NavbarItemProps<E extends React.ElementType = React.ElementType> = PolymorphicComponentProps<E, {
    align?: 'left' | 'right' | 'center';
}>


const defaultElement = 'div'

export function Item<E extends React.ElementType = typeof defaultElement>(
    props: NavbarItemProps<E>,
): JSX.Element {
    const { className, ...restProps } = props

    return (
        <Component
            className={classNames(
                'navbar-item',
                className,
            )}
            component={defaultElement}
            {...restProps}
        />
    )
}


if (process.env.NODE_ENV !== 'production') {
    Item.displayName = 'Navbar.Item'
}
