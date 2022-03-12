import * as React from 'react'
import classNames from 'classnames'

import { NavContext } from '@/components/common/Nav/context/NavContext'
import type { NavContextProps } from '@/components/common/Nav/context/NavContext'


export type HeaderProps = {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}


export function Header(props: HeaderProps): JSX.Element {
    const { className, ...restProps } = props

    const { prefixCls } = React.useContext(NavContext) as NavContextProps
    return (
        <li
            className={classNames(
                `${prefixCls}-header`,
                className,
            )}
            {...restProps}
        />
    )
}


if (process.env.NODE_ENV !== 'production') {
    Header.displayName = 'Nav.Header'
}
