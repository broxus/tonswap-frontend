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
    onChangeInput?: React.ChangeEventHandler<HTMLInputElement>;
}

export function TextInput({
    placeholder,
    value = '',
    disabled,
    invalid,
    inputMode,
    size,
    onChange,
    onChangeInput,
    onBlur,
}: TextInputProps): JSX.Element {

    const _onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e.currentTarget.value)
        onChangeInput?.(e)
    }

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
            onChange={_onChange}
            onBlur={onBlur}
            disabled={disabled}
        />
    )
}
