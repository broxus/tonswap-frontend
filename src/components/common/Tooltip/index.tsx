import * as React from 'react'
import * as ReactDOM from 'react-dom'
import classNames from 'classnames'

import './index.scss'

type Props = {
    children: React.ReactNode;
    target: React.RefObject<HTMLElement>;
    alignX?: 'left' | 'right' | 'center';
    alignY?: 'top' | 'bottom';
    width?: number;
    size?: 'small';
    forceShow?: boolean;
}

export function Tooltip({
    children,
    target,
    alignX = 'left',
    alignY = 'bottom',
    width,
    size,
    forceShow,
}: Props): JSX.Element | null {
    const [visible, setVisible] = React.useState(Boolean(forceShow))
    const tooltipRef = React.createRef<HTMLDivElement>()
    const [position, setPosition] = React.useState({
        top: 0,
        left: 0,
    })

    React.useEffect(() => {
        if (visible && target.current && tooltipRef.current) {
            const rect = target.current.getBoundingClientRect()
            let { top, left } = rect

            if (alignY === 'bottom') {
                top = rect.top + rect.height
            }

            if (alignX === 'right') {
                left = rect.right
            }

            if (alignX === 'center') {
                left = rect.left + (rect.width / 2)
            }

            const tooltipRect = tooltipRef.current.getBoundingClientRect()
            const leftOffset = window.innerWidth - tooltipRect.width - left - 8

            if (leftOffset < 0) {
                left += leftOffset
            }

            setPosition({ top, left })
        }
    }, [visible, target.current])

    React.useEffect(() => {
        const onMouseover = () => {
            setVisible(true)
        }

        const onMouseleave = () => {
            setVisible(false)
        }

        target.current?.addEventListener('mouseover', onMouseover)
        target.current?.addEventListener('mouseleave', onMouseleave)

        return () => {
            target.current?.removeEventListener('mouseover', onMouseover)
            target.current?.removeEventListener('mouseleave', onMouseleave)
        }
    }, [target])

    React.useEffect(() => {
        const onScroll = () => {
            setVisible(false)
        }

        window.addEventListener('scroll', onScroll)

        return () => {
            window.removeEventListener('scroll', onScroll)
        }
    }, [])

    return visible
        ? ReactDOM.createPortal(
            <div
                ref={tooltipRef}
                className={classNames('tooltip', {
                    'tooltip_align_top-left': alignX === 'left' && alignY === 'top',
                    'tooltip_align_top-right': alignX === 'right' && alignY === 'top',
                    'tooltip_align_top-center': alignX === 'center' && alignY === 'top',
                    'tooltip_align_bottom-right': alignX === 'right' && alignY === 'bottom',
                    'tooltip_align_bottom-center': alignX === 'center' && alignY === 'bottom',
                    [`tooltip_size_${size}`]: Boolean(size),
                })}
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    width: width && `${width}px`,
                }}
            >
                {children}
            </div>,
            document.body,
        )
        : null
}
