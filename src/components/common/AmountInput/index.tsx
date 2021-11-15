import * as React from 'react'
import { useIntl } from 'react-intl'
import classNames from 'classnames'

import { TextInput, TextInputProps } from '@/components/common/TextInput'
import { useField } from '@/hooks/useField'

import './index.scss'


type Props = {
    value?: string;
    decimals?: number;
    disabled?: boolean;
    maxIsVisible?: boolean;
    onChange?: (value: string) => void;
    onClickMax?: () => void;
    size?: TextInputProps['size'];
    invalid?: boolean;
}

export function AmountInput({
    decimals,
    disabled,
    invalid,
    maxIsVisible = true,
    size = 'small',
    onClickMax,
    ...props
}: Props): JSX.Element {
    const intl = useIntl()
    const field = useField({
        decimals,
    })

    const onChange = (value: string) => {
        let val = value.replace(/[,]/g, '.')
        if (
            props.value
            && props.value.indexOf('.') > -1
            && val.length > props.value.length
            && val.charAt(val.length - 1) === '.'
        ) {
            return
        }
        val = val.replace(/[.]+/g, '.')
        val = val.replace(/(?!- )[^0-9.]/g, '')
        props.onChange?.(val)
    }

    return (
        <div
            className={classNames('amount-input', {
                'amount-input_with-btn': maxIsVisible,
                [`amount-input_size_${size}`]: Boolean(size),
            })}
        >
            <TextInput
                value={props.value}
                disabled={disabled}
                placeholder={intl.formatMessage({
                    id: 'AMOUNT_INPUT_PLACEHOLDER',
                })}
                size={size}
                invalid={invalid}
                inputMode="decimal"
                onBlur={field.onBlur}
                onChange={onChange}
            />

            {maxIsVisible && (
                <button
                    type="button"
                    className={classNames('btn btn-tertiary', {
                        'btn-xs': size === 'small',
                        'btn-s': size === 'medium',
                    })}
                    onClick={onClickMax}
                    disabled={disabled}
                >
                    {intl.formatMessage({
                        id: 'AMOUNT_INPUT_MAX',
                    })}
                </button>
            )}
        </div>
    )
}
