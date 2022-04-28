import * as React from 'react'
import { useIntl } from 'react-intl'
import classNames from 'classnames'

import { Button } from '@/components/common/Button'
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
        value: props.value,
        onChange: props.onChange,
    })

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
                size={size}
                invalid={invalid}
                inputMode="decimal"
                onBlur={field.onBlur}
                onChangeInput={field.onChange}
                placeholder={intl.formatMessage({
                    id: 'AMOUNT_INPUT_PLACEHOLDER',
                })}
            />

            {maxIsVisible && (
                <Button
                    type="secondary"
                    className={classNames({
                        'btn-sm': size === 'small',
                    })}
                    onClick={onClickMax}
                    disabled={disabled}
                >
                    {intl.formatMessage({
                        id: 'AMOUNT_INPUT_MAX',
                    })}
                </Button>
            )}
        </div>
    )
}
