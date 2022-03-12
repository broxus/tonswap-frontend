import * as React from 'react'
import classNames from 'classnames'


export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
    asContainer?: boolean;
    transparent?: boolean;
}


export function Navbar(props: NavbarProps): JSX.Element {
    const {
        asContainer,
        className,
        transparent,
        ...restProps
    } = props

    return (
        <div
            className={classNames('navbar', {
                'navbar-container': asContainer,
                'navbar-transparent': transparent,
            }, className)}
            {...restProps}
        />
    )
}
