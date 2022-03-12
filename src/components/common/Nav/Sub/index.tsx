import * as React from 'react'
import classNames from 'classnames'
import Overflow from 'rc-overflow'
import warning from 'rc-util/lib/warning'

import { useNavId } from '@/components/common/Nav/context/IdContext'
import { NavContext, NavContextProvider } from '@/components/common/Nav/context/NavContext'
import {
    PathTrackerContext,
    PathUserContext,
    useFullPath,
    useMeasure,
} from '@/components/common/Nav/context/PathContext'
import useActive from '@/components/common/Nav/hooks/useActive'
import useMemoCallback from '@/components/common/Nav/hooks/useMemoCallback'
import { InlineSubNavList } from '@/components/common/Nav/Sub/InlineSubNavList'
import { PopupTrigger } from '@/components/common/Nav/Sub/PopupTrigger'
import { SubNavList } from '@/components/common/Nav/Sub/SubNavList'
import { parseChildren } from '@/components/common/Nav/utils/nodeUtil'
import { warnItemProp } from '@/components/common/Nav/utils/warnUtil'
import type {
    NavClickEventHandler,
    NavHoverEventHandler,
    NavInfo,
    NavTitleInfo,
    RenderIconType,
} from '@/components/common/Nav/types'
import { noop } from '@/utils'


export interface SubNavProps {
    className?: string;
    children?: React.ReactNode;
    disabled?: boolean;
    style?: React.CSSProperties;
    title?: React.ReactNode;

    /** @private Used for rest popup. Do not use in your prod */
    internalPopupClose?: boolean;

    /** @private Internal filled key. Do not set it directly */
    eventKey?: string;

    /** @private Do not use. Private warning empty usage */
    warnKey?: boolean;

    // >>>>> Icon
    itemIcon?: RenderIconType;
    expandIcon?: RenderIconType;

    // >>>>> Active
    onMouseEnter?: NavHoverEventHandler;
    onMouseLeave?: NavHoverEventHandler;

    // >>>>> Popup
    popupClassName?: string;
    popupOffset?: number[];

    // >>>>> Events
    onClick?: NavClickEventHandler;
    onTitleClick?: (info: NavTitleInfo) => void;
    onTitleMouseEnter?: NavHoverEventHandler;
    onTitleMouseLeave?: NavHoverEventHandler;

    // >>>>>>>>>>>>>>>>>>>>> Next  Round <<<<<<<<<<<<<<<<<<<<<<<
    // onDestroy?: DestroyEventHandler;
}


function InternalSubNav({
    children,
    className,
    eventKey,
    expandIcon,
    internalPopupClose,
    itemIcon,
    popupClassName,
    popupOffset,
    style,
    title,
    warnKey,
    onClick,
    onTitleClick,
    onTitleMouseEnter,
    onTitleMouseLeave,
    ...props
}: SubNavProps) {
    const domDataId = useNavId(eventKey)

    const {
        activeKey,
        disabled = props.disabled,
        expandIcon: contextExpandIcon,
        itemIcon: contextItemIcon,
        mode,
        openKeys,
        overflowDisabled,
        popupPrefixCls,
        selectedKeys,
        onActive,
        onItemClick,
        onOpenChange,
    } = React.useContext(NavContext)

    const pathUser = React.useContext(PathUserContext)
    const connectedPath = useFullPath()

    const elementRef = React.useRef<HTMLAnchorElement>(null)
    const popupRef = React.useRef<HTMLUListElement>()

    // ================================ Warn ================================
    if (process.env.NODE_ENV !== 'production' && warnKey) {
        warning(false, 'SubNav should not leave undefined `key`.')
    }

    // ================================ Icon ================================
    const mergedItemIcon = itemIcon || contextItemIcon
    const mergedExpandIcon = expandIcon || contextExpandIcon

    // ================================ Open ================================
    const originOpen = eventKey ? openKeys.includes(eventKey) : false
    const open = !overflowDisabled && originOpen

    // =============================== Select ===============================
    const childrenSelected = eventKey ? pathUser?.isSubPathKey(selectedKeys, eventKey) : false

    // =============================== Active ===============================
    const { active, ...activeProps } = useActive(
        eventKey,
        disabled,
        onTitleMouseEnter,
        onTitleMouseLeave,
    )

    // Fallback of active check to avoid hover on menu title or disabled item
    const [childrenActive, setChildrenActive] = React.useState(false)

    const triggerChildrenActive = (newActive: boolean) => {
        if (!disabled) {
            setChildrenActive(newActive)
        }
    }

    const onInternalMouseEnter: React.MouseEventHandler<HTMLLIElement> = domEvent => {
        triggerChildrenActive(true)

        if (eventKey) {
            props.onMouseEnter?.({
                domEvent,
                key: eventKey,
            })
        }
    }

    const onInternalMouseLeave: React.MouseEventHandler<HTMLLIElement> = domEvent => {
        triggerChildrenActive(false)

        if (eventKey) {
            props.onMouseLeave?.({
                domEvent,
                key: eventKey,
            })
        }
    }

    const mergedActive = React.useMemo(() => {
        if (active) {
            return active
        }

        if (mode !== 'inline' && eventKey) {
            return childrenActive || pathUser?.isSubPathKey([activeKey], eventKey)
        }

        return false
    }, [mode, active, activeKey, childrenActive, eventKey, pathUser?.isSubPathKey])

    // =============================== Events ===============================
    // Title click
    const onInternalTitleClick: React.MouseEventHandler<HTMLElement> = e => {
    // Skip if disabled
        if (disabled) {
            return
        }

        if (eventKey) {
            onTitleClick?.({
                domEvent: e,
                key: eventKey,
            })
        }

        // Trigger open by click when mode is `inline`
        if (mode === 'inline' && eventKey) {
            onOpenChange(eventKey, !originOpen)
        }
    }

    // Context for children click
    const onMergedItemClick = useMemoCallback((info: NavInfo) => {
        onClick?.(warnItemProp(info))
        onItemClick?.(info)
    })

    // Visible change
    const onPopupVisibleChange = (newVisible: boolean) => {
        if (mode !== 'inline' && eventKey) {
            onOpenChange(eventKey, newVisible)
        }
    }

    /**
     * Used for accessibility. Helper will focus element without key board.
     * We should manually trigger an active
     */
    const onInternalFocus: React.FocusEventHandler<HTMLAnchorElement> = () => {
        if (eventKey) {
            onActive(eventKey)
        }
    }

    // =============================== Render ===============================
    const popupId = domDataId ? `${domDataId}-popup` : undefined

    // Title
    let titleNode: React.ReactElement = (
        <a
            role={disabled ? undefined : 'menuitem'}
            tabIndex={disabled ? undefined : -1}
            ref={elementRef}
            title={typeof title === 'string' ? title : undefined}
            aria-controls={popupId}
            aria-disabled={disabled}
            aria-expanded={open}
            aria-haspopup
            data-nav-id={overflowDisabled && domDataId ? null : domDataId}
            onClick={onInternalTitleClick}
            onFocus={onInternalFocus}
            {...activeProps}
        >
            {title}

            {/* Only non-horizontal mode shows the icon */}
            {/*
            <Icon
                icon={mode !== 'horizontal' ? mergedExpandIcon : null}
                props={{
                    ...props,
                    isOpen: open,
                    // [Legacy] Not sure why need this mark
                    isSubNav: true,
                }}
            >
                <i className={`${subNavPrefixCls}-arrow`} />
            </Icon>
            */}
        </a>
    )

    // Cache mode if it change to `inline` which do not have popup motion
    const triggerModeRef = React.useRef(mode)
    if (mode !== 'inline') {
        triggerModeRef.current = connectedPath.length > 1 ? 'vertical' : mode
    }

    if (!overflowDisabled) {
        const triggerMode = triggerModeRef.current

        // Still wrap with Trigger here since we need avoid react re-mount dom node
        // Which makes motion failed
        titleNode = (
            <PopupTrigger
                disabled={disabled}
                mode={triggerMode}
                popup={(
                    <NavContextProvider
                        // Special handle of horizontal mode
                        mode={triggerMode === 'horizontal' ? 'vertical' : triggerMode}
                    >
                        <SubNavList
                            className={classNames(`${popupPrefixCls}-nav`)}
                            id={popupId}
                            ref={popupRef as any}
                        >
                            {children}
                        </SubNavList>
                    </NavContextProvider>
                )}
                popupClassName={popupClassName}
                popupOffset={popupOffset}
                prefixCls={popupPrefixCls}
                visible={!internalPopupClose && open && mode !== 'inline'}
                onVisibleChange={onPopupVisibleChange}
            >
                {titleNode}
            </PopupTrigger>
        )
    }

    // Render
    return (
        <NavContextProvider
            expandIcon={mergedExpandIcon}
            itemIcon={mergedItemIcon}
            mode={mode === 'horizontal' ? 'vertical' : mode}
            onItemClick={onMergedItemClick}
        >
            <Overflow.Item
                className={classNames('parent', className, {
                    active: childrenSelected,
                    disabled,
                    hover: mergedActive,
                    open,
                })}
                role="none"
                {...props}
                component="li"
                style={style}
                onMouseEnter={onInternalMouseEnter}
                onMouseLeave={onInternalMouseLeave}
            >
                {titleNode}

                {/* Inline mode */}
                {!overflowDisabled && (
                    <InlineSubNavList
                        id={popupId}
                        open={open}
                        keyPath={connectedPath}
                    >
                        {children}
                    </InlineSubNavList>
                )}
            </Overflow.Item>
        </NavContextProvider>
    )
}

// eslint-disable-next-line react/no-multi-comp
export function Sub(props: SubNavProps): JSX.Element {
    const { eventKey, children } = props

    const connectedKeyPath = useFullPath(eventKey)
    const childList: React.ReactElement[] = parseChildren(
        children,
        connectedKeyPath,
    )

    const measure = useMeasure()

    React.useEffect(() => {
        if (measure && eventKey) {
            measure.registerPath(eventKey, connectedKeyPath)
            return () => {
                measure.unregisterPath(eventKey, connectedKeyPath)
            }
        }
        return noop
    }, [connectedKeyPath])

    return (
        <PathTrackerContext.Provider value={connectedKeyPath}>
            {measure ? childList : <InternalSubNav {...props}>{childList}</InternalSubNav>}
        </PathTrackerContext.Provider>
    )
}


if (process.env.NODE_ENV !== 'production') {
    Sub.displayName = 'Nav.Sub'
}
