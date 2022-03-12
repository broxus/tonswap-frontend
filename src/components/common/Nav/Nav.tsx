import * as React from 'react'
import classNames from 'classnames'
import Overflow from 'rc-overflow'
import useMergedState from 'rc-util/lib/hooks/useMergedState'
import shallowEqual from 'shallowequal'
import type { CSSMotionProps } from 'rc-motion'

import { IdContext } from '@/components/common/Nav/context/IdContext'
import { NavContextProvider } from '@/components/common/Nav/context/NavContext'
import { PathRegisterContext, PathUserContext } from '@/components/common/Nav/context/PathContext'
import useAccessibility from '@/components/common/Nav/hooks/useAccessibility'
import useKeyRecords, { OVERFLOW_KEY } from '@/components/common/Nav/hooks/useKeyRecords'
import useMemoCallback from '@/components/common/Nav/hooks/useMemoCallback'
import useUUID from '@/components/common/Nav/hooks/useUUID'
import { Item } from '@/components/common/Nav/Item'
import { Sub } from '@/components/common/Nav/Sub'
import { parseChildren } from '@/components/common/Nav/utils/nodeUtil'
import { warnItemProp } from '@/components/common/Nav/utils/warnUtil'
import type {
    BuiltinPlacements,
    NavClickEventHandler,
    NavInfo,
    NavMode,
    NavModifier,
    RenderIconType,
    SelectEventHandler,
    SelectInfo,
    TriggerSubMenuAction,
} from '@/components/common/Nav/types'
import { collapseMotion } from '@/utils'


const EMPTY_LIST: string[] = []

export interface NavProps extends Omit<React.HTMLAttributes<HTMLUListElement>, 'onClick' | 'onSelect' | 'dir'> {
    activeKey?: string;
    builtinPlacements?: BuiltinPlacements;
    children?: React.ReactNode;
    defaultActiveFirst?: boolean;
    defaultMotions?: Partial<{ [key in NavMode | 'other']: CSSMotionProps }>;
    defaultOpenKeys?: string[];
    defaultSelectedKeys?: string[];
    direction?: 'ltr' | 'rtl';
    disabled?: boolean;
    disabledOverflow?: boolean;
    expandIcon?: RenderIconType;
    forceSubNavRender?: boolean;
    getPopupContainer?: (node: HTMLElement) => HTMLElement;
    inlineCollapsed?: boolean;
    itemIcon?: RenderIconType;
    mode?: NavMode;
    modifiers?: NavModifier | NavModifier[];
    motion?: CSSMotionProps;
    multiple?: boolean;
    openKeys?: string[];
    overflowedIndicator?: React.ReactNode;
    overflowedIndicatorPopupClassName?: string;
    popupPrefixCls?: string;
    prefixCls?: string;
    selectable?: boolean;
    selectedKeys?: string[];
    subNavCloseDelay?: number;
    subNavOpenDelay?: number;
    triggerSubNavAction?: TriggerSubMenuAction;
    onClick?: NavClickEventHandler;
    onDeselect?: SelectEventHandler;
    onOpenChange?: (openKeys: string[]) => void;
    onSelect?: SelectEventHandler;
}

export function Nav(props: NavProps): JSX.Element {
    const {
        activeKey,
        builtinPlacements,
        children,
        className,
        defaultActiveFirst,
        defaultMotions = {
            horizontal: {
                motionName: 'motion-slide-up',
            },
            inline: collapseMotion,
            other: {
                leavedClassName: 'hidden',
                motionName: 'motion-zoom',
            },
        },
        defaultOpenKeys,
        defaultSelectedKeys,
        direction,
        disabled,
        disabledOverflow,
        expandIcon,
        forceSubNavRender,
        getPopupContainer,
        id,
        inlineCollapsed,
        itemIcon,
        mode = 'inline',
        modifiers,
        motion,
        multiple = false,
        openKeys,
        overflowedIndicator = '...',
        overflowedIndicatorPopupClassName,
        popupPrefixCls = 'dropdown',
        prefixCls = 'nav',
        selectable = false,
        selectedKeys,
        style,
        subNavCloseDelay = 0.1,
        subNavOpenDelay = 0.1,
        tabIndex = 0,
        triggerSubNavAction = 'hover',
        onClick,
        onDeselect,
        onKeyDown,
        onOpenChange,
        onSelect,
        ...restProps
    } = props

    const childList: React.ReactElement[] = parseChildren(children, EMPTY_LIST)

    const [mounted, setMounted] = React.useState(false)

    const containerRef = React.useRef<HTMLUListElement | null>(null)

    const uuid = useUUID(id)

    const isRtl = direction === 'rtl'

    // Mode
    const [mergedMode] = React.useMemo<[NavMode, boolean]>(() => {
        if ((mode === 'inline' || mode === 'vertical') && inlineCollapsed) {
            return ['vertical', inlineCollapsed]
        }
        return [mode, false]
    }, [mode, inlineCollapsed])

    // Responsive
    const [lastVisibleIndex, setLastVisibleIndex] = React.useState(0)
    const allVisible = lastVisibleIndex >= childList.length - 1 || mergedMode !== 'horizontal' || disabledOverflow

    // Open
    const [mergedOpenKeys, setMergedOpenKeys] = useMergedState(defaultOpenKeys, {
        postState: keys => keys || EMPTY_LIST,
        value: openKeys,
    })

    const triggerOpenKeys = (keys: string[]) => {
        setMergedOpenKeys(keys)
        onOpenChange?.(keys)
    }

    // Cache & Reset open keys when inlineCollapsed changed
    const [inlineCacheOpenKeys, setInlineCacheOpenKeys] = React.useState(mergedOpenKeys)

    const isInlineMode = mergedMode === 'inline'

    const mountRef = React.useRef(false)

    // Cache
    React.useEffect(() => {
        if (isInlineMode) {
            setInlineCacheOpenKeys(mergedOpenKeys)
        }
    }, [mergedOpenKeys])

    // Restore
    React.useEffect(() => {
        if (!mountRef.current) {
            mountRef.current = true
            return
        }

        if (isInlineMode) {
            setMergedOpenKeys(inlineCacheOpenKeys)
        }
        else {
            // Trigger open event in case it's in control
            triggerOpenKeys(EMPTY_LIST)
        }
    }, [isInlineMode])

    // Path
    const {
        getKeyPath,
        getKeys,
        getSubPathKeys,
        isSubPathKey,
        refreshOverflowKeys,
        registerPath,
        unregisterPath,
    } = useKeyRecords()

    const registerPathContext = React.useMemo(
        () => ({ registerPath, unregisterPath }),
        [registerPath, unregisterPath],
    )

    const pathUserContext = React.useMemo(
        () => ({ isSubPathKey }),
        [isSubPathKey],
    )

    React.useEffect(() => {
        refreshOverflowKeys(
            allVisible
                ? EMPTY_LIST
                : childList
                    .slice(lastVisibleIndex + 1)
                    .map(child => child.key as string),
        )
    }, [lastVisibleIndex, allVisible])

    // Active
    const [mergedActiveKey, setMergedActiveKey] = useMergedState(
        activeKey || ((defaultActiveFirst && childList[0]?.key) as string),
        { value: activeKey },
    )

    const onActive = useMemoCallback((key: string) => {
        setMergedActiveKey(key)
    })

    const onInactive = useMemoCallback(() => {
        setMergedActiveKey('')
    })

    // Select keys
    const [mergedSelectKeys, setMergedSelectKeys] = useMergedState(
        defaultSelectedKeys || [],
        {
            // Legacy convert key to array
            postState: keys => {
                if (Array.isArray(keys)) {
                    return keys
                }

                if (keys === null || keys === undefined) {
                    return EMPTY_LIST
                }

                return [keys]
            },
            value: selectedKeys,
        },
    )

    // Trigger select
    const triggerSelection = (info: NavInfo) => {
        if (selectable) {
            // Insert or Remove
            const { key: targetKey } = info
            const exist = targetKey ? mergedSelectKeys.includes(targetKey) : false
            let newSelectKeys: string[] = []

            if (multiple) {
                if (exist) {
                    newSelectKeys = mergedSelectKeys.filter(key => key !== targetKey)
                }
                else if (targetKey) {
                    newSelectKeys = [...mergedSelectKeys, targetKey]
                }
            }
            else if (targetKey) {
                newSelectKeys = [targetKey]
            }

            if (newSelectKeys.length) {
                setMergedSelectKeys(newSelectKeys)

                // Trigger event
                const selectInfo: SelectInfo = {
                    ...info,
                    selectedKeys: newSelectKeys,
                }

                if (exist) {
                    onDeselect?.(selectInfo)
                }
                else {
                    onSelect?.(selectInfo)
                }
            }
        }

        // Whatever selectable, always close it
        if (!multiple && mergedOpenKeys?.length && mergedMode !== 'inline') {
            triggerOpenKeys(EMPTY_LIST)
        }
    }

    // Open
    /* Click for item. SubMenu do not have selection status */
    const onInternalClick = useMemoCallback((info: NavInfo) => {
        onClick?.(warnItemProp(info))
        triggerSelection(info)
    })

    const onInternalOpenChange = useMemoCallback((key: string, open: boolean) => {
        if (mergedOpenKeys === undefined) {
            return
        }

        let newOpenKeys = mergedOpenKeys.filter(k => k !== key)

        if (open) {
            newOpenKeys.push(key)
        }
        else if (mergedMode !== 'inline') {
            // We need find all related popup to close
            const subPathKeys = getSubPathKeys(key)
            newOpenKeys = newOpenKeys.filter(k => !subPathKeys.has(k))
        }

        if (!shallowEqual(mergedOpenKeys, newOpenKeys)) {
            triggerOpenKeys(newOpenKeys)
        }
    })

    const getInternalPopupContainer = getPopupContainer ? useMemoCallback(getPopupContainer) : undefined

    // Accessibility
    const triggerAccessibilityOpen = (key: string, open?: boolean) => {
        if (mergedOpenKeys === undefined) {
            return
        }

        const nextOpen = open ?? !mergedOpenKeys.includes(key)

        onInternalOpenChange(key, nextOpen)
    }

    const onInternalKeyDown = useAccessibility(
        mergedMode,
        mergedActiveKey,
        isRtl,
        uuid as string,
        containerRef,
        getKeys,
        getKeyPath,
        setMergedActiveKey,
        triggerAccessibilityOpen,
        onKeyDown,
    )

    // Effect
    React.useEffect(() => {
        setMounted(true)
    }, [])

    const wrappedChildList = (mergedMode !== 'horizontal' || disabledOverflow)
        ? childList
        // Need wrap for overflow dropdown that do not response for open
        : childList.map((child, index) => (
            // Always wrap provider to avoid sub node re-mount
            <NavContextProvider
                key={child.key}
                overflowDisabled={index > lastVisibleIndex}
            >
                {child}
            </NavContextProvider>
        ))

    const container = (
        <Overflow
            className={classNames(
                {
                    [prefixCls]: mergedMode !== 'horizontal',
                },
                (Array.isArray(modifiers) ? modifiers : [modifiers]).filter(e => e).map(mod => `${prefixCls}-${mod}`),
                {
                    // [`${prefixCls}-${mergedMode}`]: prefixCls && mergedMode,
                    [`${prefixCls}-rtl`]: prefixCls && isRtl,
                },
                className,
            )}
            component="ul"
            data={wrappedChildList}
            dir={direction}
            id={id}
            itemComponent={Item}
            maxCount={(mergedMode !== 'horizontal' || disabledOverflow)
                ? Overflow.INVALIDATE
                : Overflow.RESPONSIVE}
            ref={containerRef as any}
            renderRawItem={node => node}
            renderRawRest={omitItems => {
                // We use origin list since wrapped list use context to prevent open
                const len = omitItems.length
                const originOmitItems = len ? childList.slice(-len) : null
                return (
                    <Sub
                        disabled={allVisible}
                        eventKey={OVERFLOW_KEY}
                        internalPopupClose={len === 0}
                        popupClassName={overflowedIndicatorPopupClassName}
                        title={overflowedIndicator}
                    >
                        {originOmitItems}
                    </Sub>
                )
            }}
            prefixCls={prefixCls}
            role="menu"
            ssr="full"
            style={style}
            tabIndex={tabIndex}
            onKeyDown={onInternalKeyDown}
            onVisibleChange={newLastIndex => {
                setLastVisibleIndex(newLastIndex)
            }}
            {...restProps}
        />
    )

    // Render
    return (
        <IdContext.Provider value={uuid}>
            <NavContextProvider
                activeKey={mergedActiveKey}
                builtinPlacements={builtinPlacements}
                defaultMotions={mounted ? defaultMotions : undefined}
                disabled={disabled}
                expandIcon={expandIcon}
                forceSubNavRender={forceSubNavRender}
                getPopupContainer={getInternalPopupContainer}
                itemIcon={itemIcon}
                mode={mergedMode}
                motion={mounted ? motion : undefined}
                openKeys={mergedOpenKeys}
                popupPrefixCls={popupPrefixCls}
                prefixCls={prefixCls}
                rtl={isRtl}
                selectedKeys={mergedSelectKeys}
                subNavCloseDelay={subNavCloseDelay}
                subNavOpenDelay={subNavOpenDelay}
                triggerSubNavAction={triggerSubNavAction}
                onActive={onActive}
                onInactive={onInactive}
                onItemClick={onInternalClick}
                onOpenChange={onInternalOpenChange}
            >
                <PathUserContext.Provider value={pathUserContext}>
                    {container}
                </PathUserContext.Provider>

                {/* Measure menu keys. Add `display: none` to avoid some developer miss use the Menu */}
                <div style={{ display: 'none' }} aria-hidden>
                    <PathRegisterContext.Provider value={registerPathContext}>
                        {childList}
                    </PathRegisterContext.Provider>
                </div>
            </NavContextProvider>
        </IdContext.Provider>
    )
}
