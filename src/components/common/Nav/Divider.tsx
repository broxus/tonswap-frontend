import * as React from 'react'
import classNames from 'classnames'

import { NavContext } from '@/components/common/Nav/context/NavContext'
import { useMeasure } from '@/components/common/Nav/context/PathContext'
import type { NavContextProps } from '@/components/common/Nav/context/NavContext'


export type DividerProps = {
    className?: string;
    style?: React.CSSProperties;
}


export function Divider(props: DividerProps): JSX.Element | null {
    const { className, style } = props

    const { prefixCls } = React.useContext(NavContext) as NavContextProps
    const measure = useMeasure()

    if (measure) {
        return null
    }

    return (
        <li
            className={classNames(
                `${prefixCls}-divider`,
                className,
            )}
            style={style}
        />
    )
}


if (process.env.NODE_ENV !== 'production') {
    Divider.displayName = 'Nav.Divider'
}
