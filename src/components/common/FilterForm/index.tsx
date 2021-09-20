import * as React from 'react'
import classNames from 'classnames'
import { useIntl } from 'react-intl'

import { FilterField } from '@/components/common/FilterField'

import './style.scss'

type Props = {
    size?: 's'
    placeholder?: string
    showSubmit?: boolean
    value?: string
    onSubmit?: () => void
    onChange: (e: React.FormEvent<HTMLInputElement>) => void
}

export function FilterForm({
    size,
    placeholder,
    showSubmit = true,
    onSubmit,
    onChange,
    value,
}: Props): JSX.Element {
    const intl = useIntl()

    return (
        <div className="filter-form">
            <FilterField
                size={size}
                placeholder={placeholder}
                onChange={onChange}
                value={value}
            />

            {showSubmit && (
                <button
                    type="button"
                    onSubmit={onSubmit}
                    className={classNames('btn', 'btn-secondary', {
                        'btn-xs': size === 's',
                    })}
                >
                    {intl.formatMessage({ id: 'FILTER_FORM_BUTTON' })}
                </button>
            )}
        </div>
    )
}
