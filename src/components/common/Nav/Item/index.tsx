import * as React from 'react'

import { useFullPath, useMeasure } from '@/components/common/Nav/context/PathContext'
import { InternalNavItem } from '@/components/common/Nav/Item/InternalNavItem'
import type {
    NavClickEventHandler,
    NavHoverEventHandler,
    RenderIconType,
} from '@/components/common/Nav/types'
import { noop } from '@/utils'


export interface NavItemProps
    extends Omit<React.HTMLAttributes<HTMLLIElement>, 'onClick' | 'onMouseEnter' | 'onMouseLeave' | 'onSelect'> {
    /**
     * No place to use this. Should remove
     * @deprecated
     */
    attribute?: Record<string, string>;
    children?: React.ReactNode;
    disabled?: boolean;

    /**
     * Internal filled key. Do not set it directly
     * @private
     */
    eventKey?: string;
    itemIcon?: RenderIconType;

    /**
     * Do not use. Private warning empty usage
     * @private
     */
    warnKey?: boolean;

    // Events
    onClick?: NavClickEventHandler;

    // Active
    onMouseEnter?: NavHoverEventHandler;
    onMouseLeave?: NavHoverEventHandler;
}


export function Item(props: NavItemProps): JSX.Element | null {
    const { eventKey } = props

    const measure = useMeasure()
    const connectedKeyPath = useFullPath(eventKey)

    React.useEffect(() => {
        if (eventKey !== undefined) {
            measure?.registerPath(eventKey, connectedKeyPath)

            return () => {
                measure?.unregisterPath(eventKey, connectedKeyPath)
            }
        }
        return noop
    }, [connectedKeyPath])

    if (measure) {
        return null
    }

    return <InternalNavItem {...props} />
}


if (process.env.NODE_ENV !== 'production') {
    Item.displayName = 'Nav.Item'
}
