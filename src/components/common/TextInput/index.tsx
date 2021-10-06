import * as React from 'react'
import classNames from 'classnames'

import './index.scss'

type Props = {
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
}

export function TextInput({
    placeholder,
    value = '',
    disabled,
    onChange,
}: Props): JSX.Element {
    return (
        <input
            type="text"
            className={classNames('text-input', {
                'text-input_dirty': Boolean(value),
            })}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange && onChange(e.currentTarget.value)}
            disabled={disabled}
        />
    )
}
