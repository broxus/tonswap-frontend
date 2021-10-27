import * as React from 'react'
import classNames from 'classnames'

import './index.scss'

export type TextInputProps = {
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
    invalid?: boolean;
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
    size?: 'small' | 'medium';
}

export function TextInput({
    placeholder,
    value = '',
    disabled,
    onChange,
    invalid,
    inputMode,
    size,
}: TextInputProps): JSX.Element {
    return (
        <input
            type="text"
            className={classNames('text-input', {
                'text-input_dirty': value,
                'text-input_invalid': invalid,
                [`text-input_size_${size}`]: Boolean(size),
            })}
            placeholder={placeholder}
            inputMode={inputMode}
            value={value}
            onChange={e => onChange && onChange(e.currentTarget.value)}
            disabled={disabled}
        />
    )
}
