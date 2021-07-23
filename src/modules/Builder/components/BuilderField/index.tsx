import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

type Props = {
    disabled?: boolean;
    label: string;
    type?: string;
    isValid?: boolean;
    pattern?: string;
    value?: string;
    onChange?(value: string): void;
};

let valueWasChanged: boolean = false

function Field({ type = 'text', isValid = true, ...props }: Props): JSX.Element {
    const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        const { value } = event.target

        props.onChange?.(value)
        valueWasChanged = true
    }

    return (
        <fieldset
            className={classNames('form-fieldset', {
                alert: valueWasChanged && !isValid,
            })}
        >
            <div className="form-fieldset__header">
                <div>{props.label}</div>
            </div>
            <div className="form-fieldset__main">
                <input
                    disabled={props.disabled}
                    type={type}
                    className="form-input"
                    value={props.value}
                    pattern={props.pattern}
                    onChange={onChange}
                />
            </div>
        </fieldset>
    )
}

export const BuilderField = observer(Field)
