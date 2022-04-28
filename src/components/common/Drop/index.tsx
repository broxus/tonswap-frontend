import * as React from 'react'
import classNames from 'classnames'
import Trigger from 'rc-trigger'
import type { TriggerProps } from 'rc-trigger'
import type {
    ActionType,
    AlignType,
    AnimationType,
    BuildInPlacements,
} from 'rc-trigger/lib/interface'

import Placements from './placements'

import './index.scss'


export interface DropProps extends Pick<
    TriggerProps,
    | 'children'
    | 'getPopupContainer'
    | 'mouseEnterDelay'
    | 'mouseLeaveDelay'
> {
    align?: AlignType;
    alignPoint?: boolean;
    animation?: AnimationType;
    arrow?: boolean;
    hideAction?: ActionType[];
    minOverlayWidthMatchTrigger?: boolean;
    openClassName?: string;
    overlay?: (() => React.ReactElement) | React.ReactElement;
    overlayClassName?: string;
    overlayStyle?: React.CSSProperties;
    placement?: string;
    placements?: BuildInPlacements;
    prefixCls?: string;
    showAction?: ActionType[];
    transitionName?: string;
    trigger?: ActionType | ActionType[];
    visible?: boolean;
    onOverlayClick?: (e: Event) => void;
    onVisibleChange?: (visible: boolean) => void;
}


export const Drop = React.forwardRef<unknown, DropProps>((props, ref) => {
    const {
        align,
        alignPoint,
        animation,
        arrow = false,
        children,
        getPopupContainer,
        hideAction,
        minOverlayWidthMatchTrigger,
        overlay,
        overlayClassName,
        overlayStyle,
        prefixCls = 'drop',
        placement = 'bottom-left',
        placements = Placements,
        showAction,
        transitionName = 'motion-slide-up',
        trigger = ['hover'],
        visible,
        onOverlayClick,
        onVisibleChange,
        ...restProps
    } = props

    const triggerRef = React.useRef(null)

    const [triggerVisible, setTriggerVisible] = React.useState<boolean>()
    const mergedVisible = 'visible' in restProps ? visible : triggerVisible

    const onPopupVisibleChange = (value: boolean) => {
        setTriggerVisible(value)
        onVisibleChange?.(value)
    }

    const getOverlayElement = (): React.ReactElement => {
        if (typeof overlay === 'function') {
            return overlay()
        }
        return overlay as React.ReactElement
    }

    const getDropElement = () => (
        <>
            {arrow && <div className={`${prefixCls}-arrow`} />}
            {React.cloneElement(getOverlayElement(), {
                onClick: onOverlayClick,
            })}
        </>
    )

    const getDropElementOrLambda = () => {
        if (typeof overlay === 'function') {
            return getDropElement
        }
        return getDropElement()
    }

    const getMinOverlayWidthMatchTrigger = () => {
        if (minOverlayWidthMatchTrigger !== undefined) {
            return minOverlayWidthMatchTrigger
        }

        return !alignPoint
    }

    const renderChildren = () => {
        const childrenProps = children.props ? children.props : {}
        const childClassName = classNames(childrenProps.className, 'open')
        return triggerVisible && children
            ? React.cloneElement(children, {
                className: childClassName,
            })
            : children
    }

    React.useImperativeHandle(ref, () => triggerRef.current)

    let triggerHideAction = hideAction
    if (!triggerHideAction && trigger.indexOf('contextMenu') > -1) {
        triggerHideAction = ['click']
    }

    return (
        <Trigger
            ref={triggerRef}
            {...restProps}
            action={trigger}
            builtinPlacements={placements}
            getPopupContainer={getPopupContainer}
            hideAction={triggerHideAction || []}
            popup={getDropElementOrLambda()}
            popupAlign={align}
            popupAnimation={animation}
            popupClassName={classNames(overlayClassName, {
                [`${prefixCls}-show-arrow`]: arrow,
            })}
            popupPlacement={placement}
            popupStyle={overlayStyle}
            popupTransitionName={transitionName}
            popupVisible={mergedVisible}
            prefixCls={prefixCls}
            showAction={showAction}
            stretch={getMinOverlayWidthMatchTrigger() ? 'minWidth' : ''}
            onPopupVisibleChange={onPopupVisibleChange}
        >
            {renderChildren()}
        </Trigger>
    )
})


if (process.env.NODE_ENV !== 'production') {
    Drop.displayName = 'Drop'
}
