import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'


type Props = {
    className?: string;
    disabled?: boolean;
    label: string;
    id?: string;
    type?: string;
    isValid?: boolean;
    readOnly?: boolean;
    pattern?: string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onClick?: () => void;
}


function Field({
    className,
    isValid = true,
    type = 'text',
    ...props
}: Props): JSX.Element {
    const isDirty = React.useRef<boolean>(false)

    const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        const { value } = event.target
        props.onChange?.(value)
        isDirty.current = true
    }

    return (
        <label className="form-label" htmlFor={props.id}>
            <fieldset
                className={classNames('form-fieldset', className, {
                    invalid: isDirty.current && !isValid,
                })}
                onClick={props.onClick}
            >
                <div className="form-fieldset__header">
                    <div>{props.label}</div>
                </div>
                <div className="form-fieldset__main">
                    <input
                        disabled={props.disabled}
                        type={type}
                        className="form-input"
                        placeholder={props.placeholder}
                        value={props.value}
                        readOnly={props.readOnly}
                        pattern={props.pattern}
                        onChange={onChange}
                    />
                </div>
            </fieldset>
        </label>
    )
}

export const BuilderField = observer(Field)
