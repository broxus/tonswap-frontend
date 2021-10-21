import * as React from 'react'
import classNames from 'classnames'


type Props = {
    autoFocus?: boolean;
    disabled?: boolean;
    label: string;
    hint?: string;
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
    isValid?: boolean;
    placeholder?: string;
    readOnly?: boolean;
    value?: string;
    onChange?: (value: string) => void;
}

export function PoolField({ isValid = true, autoFocus = false, ...props }: Props): JSX.Element {
    const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        const { value } = event.target
        props.onChange?.(value)
    }

    return (
        <fieldset
            className={classNames('form-fieldset', {
                invalid: !isValid,
            })}
        >
            <div className="form-fieldset__header">
                <div>{props.label}</div>
                <div>{props.hint}</div>
            </div>
            <div className="form-fieldset__main">
                <input
                    autoFocus={autoFocus}
                    className="form-input"
                    inputMode={props.inputMode}
                    disabled={props.disabled}
                    placeholder={props.placeholder}
                    readOnly={props.readOnly}
                    type="text"
                    value={props.value}
                    onChange={onChange}
                />
            </div>
        </fieldset>
    )
}
