import * as React from 'react'
import classNames from 'classnames'

import './index.scss'

type Props = {
    className?: string;
    placeholder?: string;
    onChange: (e: React.FormEvent<HTMLInputElement>) => void;
    value?: string;
    size?: 's'
}

export function FilterField({
    className,
    placeholder,
    onChange,
    value,
    size,
}: Props): JSX.Element {
    return (
        <div
            className={classNames('filter-field', className, {
                [`filter-field_size_${size}`]: Boolean(size),
            })}
        >
            <input
                className="form-input"
                placeholder={placeholder}
                onChange={onChange}
                value={value}
            />
        </div>
    )
}
