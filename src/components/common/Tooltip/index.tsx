import * as React from 'react'
import * as ReactDOM from 'react-dom'
import classNames from 'classnames'

import './index.scss'

type Props = {
    children: React.ReactNode;
    target: React.RefObject<HTMLElement>;
    alignX?: 'left' | 'right';
}

export function Tooltip({
    children,
    target,
    alignX = 'left',
}: Props): JSX.Element | null {
    const [visible, setVisible] = React.useState(false)

    let top = 0,
        left = 0

    if (visible && target.current) {
        const rect = target.current.getBoundingClientRect()
        top = rect.top + rect.height
        left = alignX === 'left' ? rect.left : rect.right
    }

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
                className={classNames('tooltip', {
                    tooltip_x_left: alignX === 'left',
                    tooltip_x_right: alignX === 'right',
                })}
                style={{
                    top: `${top}px`,
                    left: `${left}px`,
                }}
            >
                {children}
            </div>,
            document.body,
        )
        : null
}
