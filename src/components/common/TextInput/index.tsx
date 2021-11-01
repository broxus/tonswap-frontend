import * as React from 'react'
import classNames from 'classnames'

import './index.scss'

export type TextInputProps = {
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    invalid?: boolean;
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
    size?: 'small' | 'medium';
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onChange?: (value: string) => void;
}

export function TextInput({
    placeholder,
    value = '',
    disabled,
    invalid,
    inputMode,
    size,
    onChange,
    onBlur,
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
            onBlur={onBlur}
            disabled={disabled}
        />
    )
}
