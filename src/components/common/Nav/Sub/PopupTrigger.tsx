import * as React from 'react'
import Trigger from 'rc-trigger'
import classNames from 'classnames'
import raf from 'rc-util/lib/raf'
import type { CSSMotionProps } from 'rc-motion'

import { NavContext } from '@/components/common/Nav/context/NavContext'
import { placements, placementsRtl } from '@/components/common/Nav/placements'
import { getMotion } from '@/components/common/Nav/utils/motionUtil'
import type { NavMode } from '@/components/common/Nav/types'


const popupPlacementMap: Record<NavMode, any> = {
    horizontal: 'bottom-left',
    inline: null,
    vertical: 'right-top',
    'vertical-left': 'right-top',
    'vertical-right': 'left-top',
}

export interface PopupTriggerProps {
    prefixCls: string;
    mode: NavMode;
    visible: boolean;
    children: React.ReactElement;
    popup: React.ReactNode;
    popupClassName?: string;
    popupOffset?: number[];
    disabled?: boolean;
    onVisibleChange: (visible: boolean) => void;
}

export function PopupTrigger(props: PopupTriggerProps): JSX.Element {
    const {
        prefixCls,
        visible,
        children,
        popup,
        popupClassName,
        popupOffset,
        disabled,
        mode,
        onVisibleChange,
    } = props

    const {
        getPopupContainer,
        rtl,
        subNavOpenDelay,
        subNavCloseDelay,
        builtinPlacements,
        triggerSubNavAction,
        forceSubNavRender,

        // Motion
        motion,
        defaultMotions,
    } = React.useContext(NavContext)

    const [innerVisible, setInnerVisible] = React.useState(false)

    const placement = rtl
        ? { ...placementsRtl, ...builtinPlacements }
        : { ...placements, ...builtinPlacements }

    const popupPlacement = popupPlacementMap[mode]

    const targetMotion = getMotion(mode, motion, defaultMotions)

    const mergedMotion: CSSMotionProps = {
        ...targetMotion,
        leavedClassName: 'hidden',
        motionAppear: true,
        removeOnLeave: false,
    }

    // Delay to change visible
    const visibleRef = React.useRef<number>()
    React.useEffect(() => {
        visibleRef.current = raf(() => {
            setInnerVisible(visible)
        })

        return () => {
            if (visibleRef.current) {
                raf.cancel(visibleRef.current)
            }
        }
    }, [visible])

    return (
        <Trigger
            action={disabled ? [] : [triggerSubNavAction as string]}
            builtinPlacements={placement}
            forceRender={forceSubNavRender}
            getPopupContainer={getPopupContainer}
            mouseEnterDelay={subNavOpenDelay}
            mouseLeaveDelay={subNavCloseDelay}
            popup={popup}
            popupAlign={popupOffset && { offset: popupOffset }}
            popupClassName={classNames({
                [`${prefixCls}-rtl`]: rtl,
            }, popupClassName)}
            popupMotion={mergedMotion}
            popupPlacement={popupPlacement}
            popupVisible={innerVisible}
            prefixCls={prefixCls}
            stretch={mode === 'horizontal' ? 'minWidth' : undefined}
            onPopupVisibleChange={onVisibleChange}
        >
            {children}
        </Trigger>
    )
}
