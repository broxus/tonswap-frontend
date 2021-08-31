import * as React from 'react'
import classNames from 'classnames'


type Props = {
    autoFocus?: boolean;
    disabled?: boolean;
    label: string;
    hint?: string;
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
                invalid: !isValid && !props.disabled,
            })}
        >
            <div className="form-fieldset__header">
                <div>{props.label}</div>
                <div>{props.hint}</div>
            </div>
            <div className="form-fieldset__main">
                <input
                    autoFocus={autoFocus}
                    type="text"
                    className="form-input"
                    placeholder={props.placeholder}
                    value={props.value}
                    disabled={props.disabled}
                    readOnly={props.readOnly}
                    onChange={onChange}
                />
            </div>
        </fieldset>
    )
}
