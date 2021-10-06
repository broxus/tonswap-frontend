import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './index.scss'

type Props = {
    children: React.ReactNode
    target: React.RefObject<HTMLElement>
}

export function Tooltip({
    children,
    target,
}: Props): JSX.Element | null {
    const [visible, setVisible] = React.useState(false)
    let top = 0,
        left = 0

    if (visible && target.current) {
        const rect = target.current.getBoundingClientRect()
        top = rect.top + rect.height
        left = rect.left
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
                className="tooltip"
                style={{
                    top: `${top}px`,
                    left: `${left}px`,
                }}
            >
                {children}
            </div>,
            document.getElementById('root') as Element,
        )
        : null
}
