import * as React from 'react'
import { useIntl } from 'react-intl'

import { FilterField as FilterFieldCommon } from '@/components/common/FilterField'
import { useFilterForm } from '@/modules/Builder/hooks/useFilterForm'

type Props = {
    className?: string;
}

export function FilterField({ className }: Props): JSX.Element {
    const intl = useIntl()
    const form = useFilterForm()

    const onChange = (event: React.FormEvent<HTMLInputElement>) => {
        form.onChangeData('filter')(event.currentTarget.value)
        form.debouncedFilter()
    }

    return (
        <FilterFieldCommon
            className={className}
            placeholder={intl.formatMessage({
                id: 'BUILDER_SEARCH_FIELD_PLACEHOLDER',
            })}
            onChange={onChange}
        />
    )
}
