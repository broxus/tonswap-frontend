import * as React from 'react'
import classNames from 'classnames'
import KeyCode from 'rc-util/lib/KeyCode'
import warning from 'rc-util/lib/warning'

import { useNavId } from '@/components/common/Nav/context/IdContext'
import { NavContext } from '@/components/common/Nav/context/NavContext'
import { useFullPath } from '@/components/common/Nav/context/PathContext'
import useActive from '@/components/common/Nav/hooks/useActive'
import { LegacyNavItem } from '@/components/common/Nav/Item/LegacyNavItem'
import { warnItemProp } from '@/components/common/Nav/utils/warnUtil'
import type { NavInfo } from '@/components/common/Nav/types'

import type { NavItemProps } from './index'


export function InternalNavItem(props: NavItemProps): JSX.Element {
    const {
        className,
        children,
        eventKey,
        itemIcon,
        role,
        warnKey,
        ...restProps
    } = props

    const {
        disabled = restProps.disabled,
        itemIcon: contextItemIcon,
        overflowDisabled,
        selectedKeys,
        onActive,
        onItemClick,
    } = React.useContext(NavContext)

    const legacyNavItemRef = React.useRef<any>()
    const elementRef = React.useRef<HTMLLIElement>()

    const { active, ...activeProps } = useActive(
        eventKey,
        disabled,
        restProps.onMouseEnter,
        restProps.onMouseLeave,
    )
    const connectedKeys = useFullPath(eventKey)
    const domDataId = useNavId(eventKey)

    const selected = eventKey !== undefined && selectedKeys.includes(eventKey)

    if (process.env.NODE_ENV !== 'production' && warnKey) {
        warning(false, 'NavItem should not leave undefined `key`.')
    }

    const getEventInfo = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>): NavInfo => ({
        domEvent: e,
        item: legacyNavItemRef.current,
        key: eventKey as string,
        // Note: For legacy code is reversed which not like other antd component
        keyPath: [...connectedKeys].reverse(),
    })

    const onClick: React.MouseEventHandler<HTMLLIElement> = event => {
        if (disabled) {
            return
        }

        const info = getEventInfo(event)

        restProps.onClick?.(warnItemProp(info))
        onItemClick?.(info)
    }

    const onKeyDown: React.KeyboardEventHandler<HTMLLIElement> = event => {
        restProps.onKeyDown?.(event)

        if (event.which === KeyCode.ENTER) {
            const info = getEventInfo(event)

            // Legacy. Key will also trigger click event
            restProps.onClick?.(warnItemProp(info))
            onItemClick?.(info)
        }
    }

    /*
     * Used for accessibility. Helper will focus element without key board.
     * We should manually trigger an active
     */
    const onFocus: React.FocusEventHandler<HTMLLIElement> = event => {
        if (eventKey !== undefined) {
            onActive(eventKey)
        }
        restProps.onFocus?.(event)
    }

    const optionRoleProps: React.HTMLAttributes<HTMLDivElement> = {}

    if (role === 'option') {
        optionRoleProps['aria-selected'] = selected
    }

    return (
        <LegacyNavItem
            className={classNames({
                active: selected,
                disabled,
                hover: active,
            }, className)}
            component="li"
            role={role === null ? 'none' : role || 'menuitem'}
            tabIndex={disabled ? null : -1}
            aria-disabled={disabled}
            {...optionRoleProps}
            data-nav-id={(overflowDisabled && domDataId) ? null : domDataId}
            {...restProps}
            {...activeProps}
            elementRef={elementRef}
            ref={legacyNavItemRef}
            onClick={onClick}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
        >
            {itemIcon || contextItemIcon}
            {children}
        </LegacyNavItem>
    )
}
