import { CSSMotionProps, MotionEndEventHandler, MotionEventHandler } from 'rc-motion'
import { MotionEvent } from 'rc-motion/lib/interface'

const getCollapsedHeight: MotionEventHandler = () => ({ height: 0, opacity: 0 })

const getRealHeight: MotionEventHandler = node => ({ height: node.scrollHeight, opacity: 1 })

const getCurrentHeight: MotionEventHandler = node => ({ height: node ? node.offsetHeight : 0 })

const skipOpacityTransition: MotionEndEventHandler = (_, event: MotionEvent) => (
    event?.deadline === true
    || (event as TransitionEvent).propertyName === 'height'
)

export const collapseMotion: CSSMotionProps = {
    leavedClassName: 'uk-hidden',
    motionDeadline: 300,
    motionName: 'uk-motion-collapse',
    onAppearActive: getRealHeight,
    onAppearEnd: skipOpacityTransition,
    onAppearStart: getCollapsedHeight,
    onEnterActive: getRealHeight,
    onEnterEnd: skipOpacityTransition,
    onEnterStart: getCollapsedHeight,
    onLeaveActive: getCollapsedHeight,
    onLeaveEnd: skipOpacityTransition,
    onLeaveStart: getCurrentHeight,
}

export const getTransitionName = (
    rootPrefixCls: string,
    motion: string,
    transitionName?: string,
): string => {
    if (transitionName !== undefined) {
        return transitionName
    }
    return `${rootPrefixCls}-${motion}`
}
