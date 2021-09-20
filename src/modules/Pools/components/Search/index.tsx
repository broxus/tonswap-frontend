import * as React from 'react'
import { useIntl } from 'react-intl'

import { SectionTitle } from '@/components/common/SectionTitle'
import { FilterForm } from '@/components/common/FilterForm'

import './style.scss'

type Props = {
    onSearch: (value: string) => void;
}

export function Search({
    onSearch,
}: Props): JSX.Element {
    const intl = useIntl()
    const [value, setValue] = React.useState('')

    const onChange = (e: React.FormEvent<HTMLInputElement>) => {
        setValue(e.currentTarget.value)
        onSearch(e.currentTarget.value)
    }

    return (
        <div className="pools-sub-header pools-filter-form">
            <SectionTitle size="small">
                {intl.formatMessage({ id: 'POOLS_LIST_FAV_TITLE' })}
            </SectionTitle>

            <FilterForm
                size="s"
                placeholder={intl.formatMessage({ id: 'POOLS_LIST_FILTER_PLACEHOLDER' })}
                showSubmit={false}
                onChange={onChange}
                value={value}
            />
        </div>
    )
}
