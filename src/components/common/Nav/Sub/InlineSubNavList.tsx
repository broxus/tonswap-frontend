import * as React from 'react'
import CSSMotion from 'rc-motion'

import { getMotion } from '@/components/common/Nav/utils/motionUtil'
import { NavContext, NavContextProvider } from '@/components/common/Nav/context/NavContext'
import { SubNavList } from '@/components/common/Nav/Sub/SubNavList'
import type { NavContextProps } from '@/components/common/Nav/context/NavContext'
import type { NavMode } from '@/components/common/Nav/types'


export interface InlineSubNavListProps {
  id?: string;
  open: boolean;
  keyPath: string[];
  children: React.ReactNode;
}

export function InlineSubNavList(props: InlineSubNavListProps): JSX.Element | null {
    const {
        children,
        id,
        keyPath,
        open,
    } = props

    const fixedMode: NavMode = 'inline'

    const {
        prefixCls,
        forceSubNavRender,
        motion,
        defaultMotions,
        mode,
    } = React.useContext(NavContext) as NavContextProps

    // Always use latest mode check
    const sameModeRef = React.useRef(false)
    sameModeRef.current = mode === fixedMode

    // We record `destroy` mark here since when mode change from `inline` to others.
    // The inline list should remove when motion end.
    const [destroy, setDestroy] = React.useState(!sameModeRef.current)

    const mergedOpen = sameModeRef.current ? open : false

    // ================================= Effect =================================
    // Reset destroy state when mode change back
    React.useEffect(() => {
        if (sameModeRef.current) {
            setDestroy(false)
        }
    }, [mode])

    // ================================= Render =================================
    const mergedMotion = { ...getMotion(fixedMode, motion, defaultMotions) }

    // No need appear since nest inlineCollapse changed
    if (keyPath.length > 1) {
        mergedMotion.motionAppear = false
    }

    // Hide inline list when mode changed and motion end
    const originOnVisibleChanged = mergedMotion.onVisibleChanged
    mergedMotion.onVisibleChanged = newVisible => {
        if (!sameModeRef.current && !newVisible) {
            setDestroy(true)
        }

        return originOnVisibleChanged?.(newVisible)
    }

    if (destroy) {
        return null
    }

    return (
        <NavContextProvider mode={fixedMode} locked={!sameModeRef.current} prefixCls={prefixCls}>
            <CSSMotion
                visible={mergedOpen}
                {...mergedMotion}
                forceRender={forceSubNavRender}
                leavedClassName="hidden"
                removeOnLeave={false}
            >
                {({ className: motionClassName, style: motionStyle }) => (
                    <SubNavList
                        className={motionClassName}
                        id={id}
                        style={motionStyle}
                    >
                        {children}
                    </SubNavList>
                )}
            </CSSMotion>
        </NavContextProvider>
    )
}
