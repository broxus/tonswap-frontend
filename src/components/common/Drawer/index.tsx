import * as React from 'react'
import classNames from 'classnames'
import RcDrawer from 'rc-drawer'
import type { GetContainer } from 'rc-util/lib/PortalWrapper'

import { useForceUpdate } from '@/hooks/useForceUpdate'
import { tuple } from '@/utils'

import './index.scss'


export type DrawerRef = {
    push(): void;
    pull(): void;
    collapse(): void;
    expand(): void;
};

const DrawerContext = React.createContext<DrawerRef | null>(null)

type EventType = React.KeyboardEvent | React.MouseEvent

type LevelMove = number | [number, number]

const PlacementTypes = tuple('top', 'right', 'bottom', 'left')
type PlacementType = typeof PlacementTypes[number]

const SizeTypes = tuple('default', 'large')
type SizeType = typeof SizeTypes[number]

type TriggerArguments = {
    collapse: () => void;
    expand: () => void;
    isOpen: boolean;
}

export interface PushState {
    distance: string | number;
}

export interface DrawerProps {
    afterVisibleChange?: (visible: boolean) => void;
    animation?: 'push' | 'reveal';
    autoFocus?: boolean;
    children?: React.ReactNode;
    className?: string;
    closable?: boolean;
    closeIcon?: React.ReactNode;
    defaultOpen?: boolean;
    destroyOnClose?: boolean;
    direction?: 'ltr' | 'rtl';
    duration?: string;
    ease?: string;
    forceRender?: boolean;
    getContainer?: GetContainer;
    handler?: React.ReactElement | null | false;
    height?: number | string;
    keyboard?: boolean;
    level?: string | string[] | null;
    levelMove?: LevelMove | ((event: { target: HTMLElement; open: boolean }) => LevelMove);
    maskClosable?: boolean;
    maskStyle?: React.CSSProperties;
    open?: boolean;
    placement?: PlacementType;
    prefixCls?: string;
    push?: boolean | PushState;
    showMask?: boolean;
    size?: SizeType;
    style?: React.CSSProperties;
    trigger?: (args: TriggerArguments) => JSX.Element;
    width?: number | string;
    wrapperClassName?: string;
    zIndex?: number;
    onClose?: (event: EventType) => void;
}

const defaultPushState: PushState = { distance: 180 }


export const Drawer = React.forwardRef<DrawerRef, DrawerProps>((props, ref): JSX.Element => {
    const {
        animation,
        children,
        className,
        defaultOpen,
        destroyOnClose,
        direction,
        duration = '0.2s',
        ease = 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
        keyboard = true,
        level = null,
        maskClosable = true,
        open,
        placement = 'right' as PlacementType,
        prefixCls = 'drawer',
        push = defaultPushState,
        showMask = true,
        size = 'default',
        style,
        trigger,
        wrapperClassName,
        zIndex,
        ...restProps
    } = props

    const forceUpdate = useForceUpdate()
    const parentDrawer = React.useContext(DrawerContext)
    const destroyClose = React.useRef<boolean>(false)

    const [internalPush, setPush] = React.useState(false)
    const [internalOpen, setOpen] = React.useState(defaultOpen)
    // eslint-disable-next-line no-param-reassign
    const mergedOpen = open === undefined ? internalOpen : open

    React.useEffect(() => {
        // fix: delete drawer in child and re-render, no push started.
        // <Drawer>{show && <Drawer />}</Drawer>
        if (mergedOpen && parentDrawer) {
            parentDrawer.push()
        }

        return () => {
            if (parentDrawer) {
                parentDrawer.pull()
                // parentDrawer = null
            }
        }
    }, [])

    React.useEffect(() => {
        if (parentDrawer) {
            if (mergedOpen) {
                parentDrawer.push()
                forceUpdate()
            }
            else {
                parentDrawer.pull()
                forceUpdate()
            }
        }
    }, [mergedOpen])

    const drawerClassName = React.useMemo(() => classNames({
        [`${prefixCls}-${size}`]: size !== undefined,
        [`${prefixCls}-${animation}`]: animation !== undefined,
        [`${prefixCls}-rtl`]: direction === 'rtl',
        'no-mask': !showMask,
    }, className), [prefixCls, size, animation, showMask, direction, className])

    const drawerWrapperClassName = React.useMemo(() => classNames(`${prefixCls}-container`, {
        [`${prefixCls}-${animation}-container`]: animation !== undefined,
    }, wrapperClassName), [prefixCls, animation, wrapperClassName])

    const operations = React.useMemo(() => ({
        pull() {
            if (push) {
                setPush(false)
                forceUpdate()
            }
        },
        push() {
            if (push) {
                setPush(true)
                forceUpdate()
            }
        },
        expand() {
            setOpen(true)
        },
        collapse() {
            setOpen(false)
        },
    }), [push])

    React.useImperativeHandle(ref, () => operations, [operations])

    const isDestroyOnClose = destroyOnClose && !mergedOpen

    const afterVisibleChange = (visible: boolean) => {
        restProps.afterVisibleChange?.(visible)
        if (visible) {
            // addModalMode()
        }
        else {
            // removeModalMode()
        }
    }

    const getRcDrawerStyle = () => {
        // get drawer push width or height
        const getPushTransform = (_placement?: PlacementType) => {
            let distance: number | string
            // noinspection SuspiciousTypeOfGuard
            if (typeof push === 'boolean') {
                distance = push ? defaultPushState.distance : 0
            }
            else {
                distance = push?.distance
            }
            distance = parseFloat(String(distance || 0))

            if (_placement === 'left' || _placement === 'right') {
                return `translateX(${_placement === 'left' ? distance : -distance}px)`
            }
            if (_placement === 'top' || _placement === 'bottom') {
                return `translateY(${_placement === 'top' ? distance : -distance}px)`
            }
            return ''
        }

        return {
            transform: internalPush ? getPushTransform(placement) : undefined,
            zIndex,
            ...style,
        }
    }

    const collapse = () => {
        setOpen(false)
    }

    const expand = () => {
        setOpen(true)
    }

    const onClose = (event: EventType) => {
        setOpen(false)
        restProps.onClose?.(event)
    }

    const onDestroyTransitionEnd = () => {
        if (!isDestroyOnClose) {
            return
        }
        if (!mergedOpen) {
            destroyClose.current = true
            forceUpdate()
        }
    }

    const renderBody = () => {
        if (destroyClose.current && !mergedOpen) {
            return null
        }
        destroyClose.current = false

        const containerStyle: React.CSSProperties = {}

        if (isDestroyOnClose) {
            // Increase the opacity transition, delete children after closing.
            containerStyle.opacity = 0
            containerStyle.transition = 'opacity 0.2s'
        }

        return (
            <div
                className={`${prefixCls}-body-wrapper`}
                style={containerStyle}
                onTransitionEnd={onDestroyTransitionEnd}
            >
                <div className={`${prefixCls}-body`}>
                    {children}
                </div>
            </div>
        )
    }

    return (
        <DrawerContext.Provider value={operations}>
            {trigger?.({ collapse, expand, isOpen: !!mergedOpen })}

            <RcDrawer
                {...{
                    afterVisibleChange,
                    children,
                    className: drawerClassName,
                    defaultOpen,
                    duration,
                    ease,
                    handler: false,
                    keyboard,
                    level: (animation !== undefined && level == null) ? 'all' : level,
                    maskClosable,
                    open: mergedOpen,
                    placement,
                    prefixCls,
                    showMask,
                    style: getRcDrawerStyle(),
                    wrapperClassName: drawerWrapperClassName,
                    ...restProps,
                    onClose,
                }}
            >
                {renderBody()}
            </RcDrawer>
        </DrawerContext.Provider>
    )
})
