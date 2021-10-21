import * as React from 'react'
import { useIntl } from 'react-intl'
import classNames from 'classnames'

import { TextInput, TextInputProps } from '@/components/common/TextInput'

import './index.scss'

type Props = {
    value?: string;
    disabled?: boolean;
    maxIsVisible?: boolean;
    onChange?: (value: string) => void;
    onClickMax?: () => void;
    size?: TextInputProps['size'];
    invalid?: boolean;
}

export function AmountInput({
    value,
    disabled,
    maxIsVisible = true,
    onChange,
    onClickMax,
    size = 'small',
    invalid,
}: Props): JSX.Element {
    const intl = useIntl()

    return (
        <div
            className={classNames('amount-input', {
                'amount-input_with-btn': maxIsVisible,
                [`amount-input_size_${size}`]: Boolean(size),
            })}
        >
            <TextInput
                onChange={onChange}
                value={value}
                disabled={disabled}
                placeholder={intl.formatMessage({
                    id: 'AMOUNT_INPUT_PLACEHOLDER',
                })}
                size={size}
                invalid={invalid}
                inputMode="numeric"
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
