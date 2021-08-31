import * as React from 'react'
import classNames from 'classnames'

type Props = {
    items: {
        active?: boolean
        onClick: () => void
        label: React.ReactNode
    }[]
}

export function Tabs({
    items,
}: Props): JSX.Element {
    return (
        <ul className="tabs">
            {/* eslint-disable react/no-array-index-key */}
            {items.map(({ active, onClick, label }, index) => (
                <li className={classNames({ active })} key={index}>
                    {/* eslint-disable jsx-a11y/anchor-is-valid */}
                    <a onClick={onClick}>
                        {label}
                    </a>
                </li>
            ))}
        </ul>
    )
}
