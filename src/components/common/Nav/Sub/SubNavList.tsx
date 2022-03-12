import * as React from 'react'
import classNames from 'classnames'

import { NavContext } from '@/components/common/Nav/context/NavContext'


export interface SubNavListProps extends React.HTMLAttributes<HTMLUListElement> {
    children?: React.ReactNode;
}


function InternalSubNavList(
    props: SubNavListProps,
    ref: React.Ref<HTMLUListElement>,
) {
    const { className, children, ...restProps } = props

    const { mode, prefixCls, rtl } = React.useContext(NavContext)

    return (
        <ul
            className={classNames({
                [prefixCls]: mode !== 'inline',
                [`${prefixCls}-sub`]: mode === 'inline',
                [`${prefixCls}-sub-rtl`]: rtl && mode === 'inline',
            }, className)}
            {...restProps}
            data-nav-list=""
            ref={ref}
        >
            {children}
        </ul>
    )
}

export const SubNavList = React.forwardRef(InternalSubNavList)

SubNavList.displayName = 'SubNavList'
