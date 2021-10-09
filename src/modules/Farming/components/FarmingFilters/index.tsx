import * as React from 'react'
import { useIntl } from 'react-intl'
import classNames from 'classnames'

import { FilterField } from '@/components/common/FilterField'
import { FarmingFiltersPopup } from '@/modules/Farming/components/FarmingFilters/popup'
import { useLocationFilter } from '@/modules/Farming/hooks/useLocationFilter'
import { FarmingPoolFilter } from '@/modules/Farming/types'
import { useDropdown } from '@/hooks/useDropdown'

import './index.scss'

type Props = {
    queryParamPrefix?: string;
    lowBalanceEnabled?: boolean;
    onSubmit: (filter: FarmingPoolFilter) => void;
    onQuery: (value: string) => void;
}

export function FarmingFilters({
    queryParamPrefix,
    lowBalanceEnabled,
    onSubmit,
    onQuery,
}: Props): JSX.Element {
    const intl = useIntl()
    const locationFilter = useLocationFilter(queryParamPrefix)
    const [filter, setFilter] = React.useState<FarmingPoolFilter>(locationFilter.parse())
    const [query, setQuery] = React.useState('')
    const [tokenListVisible, setTokenListVisible] = React.useState(false)
    const dropdown = useDropdown(!tokenListVisible)

    const onOpenTokenList = () => {
        setTokenListVisible(true)
    }

    const onCloseTokenList = () => {
        setTokenListVisible(false)
    }

    const onChangeFilter = (value: FarmingPoolFilter) => {
        setFilter(value)
    }

    const onChangeQuery = (e: React.FormEvent<HTMLInputElement>) => {
        setQuery(e.currentTarget.value)
        onQuery(e.currentTarget.value)
    }

    const enabledFilterCount = Object.entries(filter)
        .reduce((acc, [key, value]) => {
            if (key === 'isLowBalance' && value === false) {
                return acc
            }
            if (value === '') {
                return acc
            }
            return value === undefined ? acc : acc + 1
        }, 0)

    React.useEffect(() => {
        locationFilter.update(filter)
    }, [filter])

    React.useEffect(() => {
        onSubmit(filter)
    }, [filter])

    return (
        <div className="farming-filters">
            <FilterField
                size="s"
                placeholder={intl.formatMessage({
                    id: 'FARMING_FILTER_FORM_INPUT',
                })}
                value={query}
                onChange={onChangeQuery}
            />

            <button
                type="button"
                className={classNames('btn btn-tertiary btn-xs btn-with-icon', {
                    active: dropdown.visible,
                })}
                onClick={dropdown.open}
            >
                {intl.formatMessage({
                    id: 'FARMING_FILTER_FORM_BUTTON',
                })}
                {enabledFilterCount > 0 && (
                    <span className="btn__counter">{enabledFilterCount}</span>
                )}
            </button>

            {dropdown.visible && (
                <div ref={dropdown.popupRef}>
                    <FarmingFiltersPopup
                        filter={filter}
                        lowBalanceEnabled={lowBalanceEnabled}
                        resetEnabled={enabledFilterCount > 0}
                        onOpenTokenList={onOpenTokenList}
                        onCloseTokenList={onCloseTokenList}
                        onChangeFilter={onChangeFilter}
                    />
                </div>
            )}
        </div>
    )
}
