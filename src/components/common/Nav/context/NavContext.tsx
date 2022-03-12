import * as React from 'react'
import useMemo from 'rc-util/lib/hooks/useMemo'
import shallowEqual from 'shallowequal'
import type { CSSMotionProps } from 'rc-motion'

import type {
    BuiltinPlacements,
    NavClickEventHandler,
    NavMode,
    RenderIconType,
    TriggerSubMenuAction,
} from '@/components/common/Nav/types'


export interface NavContextProps {
    activeKey: string;
    builtinPlacements?: BuiltinPlacements;
    defaultMotions?: Partial<{ [key in NavMode | 'other']: CSSMotionProps }>;
    disabled?: boolean;
    expandIcon?: RenderIconType;
    forceSubNavRender?: boolean;
    getPopupContainer: (node: HTMLElement) => HTMLElement;
    itemIcon?: RenderIconType;
    mode: NavMode;
    motion?: CSSMotionProps;
    openKeys: string[];
    overflowDisabled?: boolean;
    popupPrefixCls: string;
    prefixCls: string;
    rtl?: boolean;
    selectedKeys: string[];
    subNavOpenDelay: number;
    subNavCloseDelay: number;
    triggerSubNavAction?: TriggerSubMenuAction;
    onActive: (key: string) => void;
    onInactive: (key: string) => void;
    onItemClick: NavClickEventHandler;
    onOpenChange: (key: string, open: boolean) => void;
}

export const NavContext = React.createContext<NavContextProps>({
    popupPrefixCls: 'dropdown',
    prefixCls: 'nav',
} as NavContextProps)

function mergeProps(origin: NavContextProps, target: Partial<NavContextProps>): NavContextProps {
    const clone: NavContextProps = { ...origin }

    Object.keys(target).forEach(key => {
        // @ts-ignore
        const value = target[key]
        if (value !== undefined) {
            // @ts-ignore
            clone[key] = value
        }
    })

    return clone
}

export interface InheritableContextProps extends Partial<NavContextProps> {
    children?: React.ReactNode;
    locked?: boolean;
}

export function NavContextProvider({ children, locked, ...props }: InheritableContextProps): JSX.Element {
    const context = React.useContext(NavContext)

    const inheritableContext = useMemo(
        () => mergeProps(context, props),
        [context, props],
        (prev, next) => !locked && (prev[0] !== next[0] || !shallowEqual(prev[1], next[1])),
    )

    return (
        <NavContext.Provider value={inheritableContext}>
            {children}
        </NavContext.Provider>
    )
}
