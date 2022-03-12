import * as React from 'react'
import classNames from 'classnames'
import omit from 'rc-util/lib/omit'

import { NavContext } from '@/components/common/Nav/context/NavContext'
import { useFullPath, useMeasure } from '@/components/common/Nav/context/PathContext'
import type { NavContextProps } from '@/components/common/Nav/context/NavContext'
import { parseChildren } from '@/components/common/Nav/utils/nodeUtil'


export interface NavItemGroupProps {
    className?: string;
    title?: React.ReactNode;
    children?: React.ReactNode;

    /** @private Internal filled key. Do not set it directly */
    eventKey?: string;

    /** @private Do not use. Private warning empty usage */
    warnKey?: boolean;
}

function InternalNavItemGroup({
    children,
    className,
    title,
    ...props
}: NavItemGroupProps) {
    const { prefixCls } = React.useContext(NavContext) as NavContextProps

    const groupPrefixCls = `${prefixCls}-group`

    return (
        <li
            className={classNames(groupPrefixCls, className)}
            {...props}
            onClick={e => e.stopPropagation()}
        >
            <div
                className={`${groupPrefixCls}-header`}
                title={typeof title === 'string' ? title : undefined}
            >
                {title}
            </div>
            <ul className="nav-sub">{children}</ul>
        </li>
    )
}

// eslint-disable-next-line react/no-multi-comp
export function Group({
    children,
    ...props
}: NavItemGroupProps): JSX.Element {
    const connectedKeyPath = useFullPath(props.eventKey)
    const childList: React.ReactElement[] = parseChildren(
        children,
        connectedKeyPath,
    )

    const measure = useMeasure()
    if (measure) {
        return childList as any as React.ReactElement
    }

    return (
        <InternalNavItemGroup {...omit(props, ['warnKey'])}>
            {childList}
        </InternalNavItemGroup>
    )
}


if (process.env.NODE_ENV !== 'production') {
    Group.displayName = 'Nav.Group'
}
