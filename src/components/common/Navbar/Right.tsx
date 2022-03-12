import * as React from 'react'
import classNames from 'classnames'

import { Component } from '@/components/common/Component'
import type { PolymorphicComponentProps } from '@/components/common/Component'


export type NavbarRightProps<E extends React.ElementType = React.ElementType> = PolymorphicComponentProps<E, unknown>


const defaultElement = 'div'

export function Right<E extends React.ElementType = typeof defaultElement>(
    props: NavbarRightProps<E>,
): JSX.Element {
    const { className, ...restProps } = props

    return (
        <Component
            className={classNames(
                'navbar-right',
                className,
            )}
            component={defaultElement}
            {...restProps}
        />
    )
}


if (process.env.NODE_ENV !== 'production') {
    Right.displayName = 'Navbar.Right'
}
