import * as React from 'react'
import classNames from 'classnames'

import { Icon } from '@/components/common/Icon'

import './index.scss'

type Props = {
    value?: string
    placeholder: string
    onClick?: () => void
}

export function SelectButton({
    value,
    placeholder,
    onClick,
}: Props): JSX.Element {
    return (
        <button
            type="button"
            onClick={onClick}
            className={classNames('select-button', {
                'select-button_dirty': Boolean(value),
            })}
        >
            <span className="select-button__label" title={value || placeholder}>
                {value || placeholder}
            </span>
            <Icon icon="arrowDown" />
        </button>
    )
}
