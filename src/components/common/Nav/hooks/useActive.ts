import * as React from 'react'

import { NavContext } from '@/components/common/Nav/context/NavContext'
import type { NavContextProps } from '@/components/common/Nav/context/NavContext'
import type { NavHoverEventHandler } from '@/components/common/Nav/types'


interface ActiveObj {
  active: boolean;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
}


export default function useActive(
    eventKey?: string,
    disabled?: boolean,
    onMouseEnter?: NavHoverEventHandler,
    onMouseLeave?: NavHoverEventHandler,
): ActiveObj {
    if (eventKey === undefined) {
        return { active: false }
    }

    const {
        // Active
        activeKey,
        onActive,
        onInactive,
    } = React.useContext(NavContext) as NavContextProps

    const ret: ActiveObj = {
        active: activeKey === eventKey,
    }

    // Skip when disabled
    if (!disabled) {
        ret.onMouseEnter = domEvent => {
            onMouseEnter?.({
                domEvent,
                key: eventKey,
            })
            onActive(eventKey)
        }
        ret.onMouseLeave = domEvent => {
            onMouseLeave?.({
                domEvent,
                key: eventKey,
            })
            onInactive(eventKey)
        }
    }

    return ret
}
