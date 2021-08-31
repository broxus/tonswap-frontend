import * as React from 'react'
import classNames from 'classnames'

import './style.scss'

type Props = {
    tagName?: keyof JSX.IntrinsicElements
    children?: React.ReactNode
    className?: string
    size?: 'small'
}

export function SectionTitle({
    children,
    tagName = 'h3',
    className,
    size,
}: Props): JSX.Element {
    const Tag = tagName

    return (
        <Tag
            className={classNames('section-title', className, {
                [`section-title--${size}`]: Boolean(size),
            })}
        >
            {children}
        </Tag>
    )
}
