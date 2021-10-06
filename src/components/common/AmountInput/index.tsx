import * as React from 'react'
import { useIntl } from 'react-intl'
import classNames from 'classnames'

import { TextInput } from '@/components/common/TextInput'

import './index.scss'

type Props = {
    value?: string;
    disabled?: boolean;
    maxIsVisible?: boolean;
    onChange?: (value: string) => void;
    onClickMax?: () => void
}

export function AmountInput({
    value,
    disabled,
    maxIsVisible = true,
    onChange,
    onClickMax,
}: Props): JSX.Element {
    const intl = useIntl()

    return (
        <div
            className={classNames('amount-input', {
                'amount-input_with-btn': Boolean(onClickMax),
            })}
        >
            <TextInput
                onChange={onChange}
                value={value}
                disabled={disabled}
                placeholder={intl.formatMessage({
                    id: 'AMOUNT_INPUT_PLACEHOLDER',
                })}
            />

            {maxIsVisible && (
                <button
                    type="button"
                    className="btn btn-xs btn-tertiary"
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
