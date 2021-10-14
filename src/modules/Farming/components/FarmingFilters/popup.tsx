import * as React from 'react'
import { useIntl } from 'react-intl'

import { TextInput } from '@/components/common/TextInput'
import { Checkbox } from '@/components/common/Checkbox'
import { TokenSelector } from '@/modules/TokensList/components/TokenSelector'
import { FarmingPoolFilter } from '@/modules/Farming/types'

import './index.scss'

type Props = {
    filter?: FarmingPoolFilter
    lowBalanceEnabled?: boolean;
    resetEnabled?: boolean;
    onOpenTokenList?: () => void;
    onCloseTokenList?: () => void;
    onChangeFilter: (filter: FarmingPoolFilter) => void;
}

export function FarmingFiltersPopup({
    filter = {},
    lowBalanceEnabled,
    resetEnabled,
    onOpenTokenList,
    onCloseTokenList,
    onChangeFilter,
}: Props): JSX.Element {
    const intl = useIntl()
    const [tvlFrom, setTvlFrom] = React.useState(filter.tvlFrom || '')
    const [tvlTo, setTvlTo] = React.useState(filter.tvlTo || '')
    const [aprFrom, setAprFrom] = React.useState(filter.aprFrom || '')
    const [aprTo, setAprTo] = React.useState(filter.aprTo || '')

    const applyEnabled = (filter.aprTo || '') !== aprTo
        || (filter.aprFrom || '') !== aprFrom
        || (filter.tvlTo || '') !== tvlTo
        || (filter.tvlFrom || '') !== tvlFrom

    const changeFilter = (key: keyof FarmingPoolFilter) => (
        (value: FarmingPoolFilter[typeof key]) => {
            onChangeFilter({
                ...filter,
                [key]: value,
            })
        }
    )

    const changeState = (state?: FarmingPoolFilter['state']) => {
        changeFilter('state')(state)
    }

    const changeOwnerInclude = (state?: FarmingPoolFilter['ownerInclude']) => {
        changeFilter('ownerInclude')(state)
    }

    const submit = () => {
        onChangeFilter({
            ...filter,
            tvlFrom,
            tvlTo,
            aprFrom,
            aprTo,
        })
    }

    const reset = () => {
        setTvlFrom('')
        setTvlTo('')
        setAprFrom('')
        setAprTo('')
        onChangeFilter({})
    }

    const onSubmitForm = (e: React.FormEvent) => {
        e.preventDefault()
        submit()
    }

    const onChangeAwaiting = (value: boolean) => {
        changeState(value ? 'awaiting' : undefined)
    }

    const onChangeActive = (value: boolean) => {
        changeState(value ? 'active' : undefined)
    }

    const onChangeUnactive = (value: boolean) => {
        changeState(value ? 'noActive' : undefined)
    }

    const onChangeWithMyFarming = (value: boolean) => {
        changeOwnerInclude(value || undefined)
    }

    const onChangeWithoutMyFarming = (value: boolean) => {
        changeOwnerInclude(value === true ? false : undefined)
    }

    const onChangeLowBalance = (value: boolean) => {
        changeFilter('isLowBalance')(value)
    }

    return (
        <form
            className="farming-filters-popup"
            onSubmit={onSubmitForm}
        >
            <h3 className="farming-filters-popup__title">
                {intl.formatMessage({
                    id: 'FARMING_FILTER_TITLE',
                })}
            </h3>
            <h4 className="farming-filters-popup__sub-title">
                {intl.formatMessage({
                    id: 'FARMING_FILTER_PAIR',
                })}
            </h4>
            <div className="farming-filters-popup__cols">
                <TokenSelector
                    root={filter.leftRoot}
                    onOpen={onOpenTokenList}
                    onClose={onCloseTokenList}
                    onSelect={changeFilter('leftRoot')}
                />

                <TokenSelector
                    root={filter.rightRoot}
                    onOpen={onOpenTokenList}
                    onClose={onCloseTokenList}
                    onSelect={changeFilter('rightRoot')}
                />
            </div>
            <h4 className="farming-filters-popup__sub-title">
                {intl.formatMessage({
                    id: 'FARMING_FILTER_STATES',
                })}
            </h4>
            <div className="farming-filters-popup__rows">
                <div>
                    <Checkbox
                        label={intl.formatMessage({
                            id: 'FARMING_FILTER_AWAITING',
                        })}
                        checked={filter.state === 'awaiting'}
                        onChange={onChangeAwaiting}
                    />
                </div>
                <div>
                    <Checkbox
                        label={intl.formatMessage({
                            id: 'FARMING_FILTER_ACTIVE',
                        })}
                        checked={filter.state === 'active'}
                        onChange={onChangeActive}
                    />
                </div>
                <div>
                    <Checkbox
                        label={intl.formatMessage({
                            id: 'FARMING_FILTER_UNACTIVE',
                        })}
                        checked={filter.state === 'noActive'}
                        onChange={onChangeUnactive}
                    />
                </div>
            </div>
            <h4 className="farming-filters-popup__sub-title">
                {intl.formatMessage({
                    id: 'FARMING_FILTER_MY_FARMING',
                })}
            </h4>
            <div className="farming-filters-popup__rows">
                <div>
                    <Checkbox
                        label={intl.formatMessage({
                            id: 'FARMING_FILTER_WITH_MY_FARMING',
                        })}
                        checked={filter.ownerInclude === true}
                        onChange={onChangeWithMyFarming}
                    />
                </div>
                <div>
                    <Checkbox
                        label={intl.formatMessage({
                            id: 'FARMING_FILTER_WITHOUT_MY_FARMING',
                        })}
                        checked={filter.ownerInclude === false}
                        onChange={onChangeWithoutMyFarming}
                    />
                </div>
            </div>
            {lowBalanceEnabled && (
                <>
                    <h4 className="farming-filters-popup__sub-title">
                        {intl.formatMessage({
                            id: 'FARMING_FILTER_POOL_BALANCE',
                        })}
                    </h4>
                    <div className="farming-filters-popup__rows">
                        <div>
                            <Checkbox
                                label={intl.formatMessage({
                                    id: 'FARMING_FILTER_WITH_LOW_BALANCE',
                                })}
                                checked={filter.isLowBalance === true}
                                onChange={onChangeLowBalance}
                            />
                        </div>
                    </div>
                </>
            )}
            <h4 className="farming-filters-popup__sub-title">
                {intl.formatMessage({
                    id: 'FARMING_FILTER_TVL',
                })}
            </h4>
            <div className="farming-filters-popup__cols">
                <TextInput
                    placeholder={intl.formatMessage({
                        id: 'FARMING_FILTER_FROM',
                    })}
                    value={tvlFrom}
                    onChange={setTvlFrom}
                />
                <TextInput
                    placeholder={intl.formatMessage({
                        id: 'FARMING_FILTER_TO',
                    })}
                    value={tvlTo}
                    onChange={setTvlTo}
                />
            </div>
            <h4 className="farming-filters-popup__sub-title">
                {intl.formatMessage({
                    id: 'FARMING_FILTER_APY',
                })}
            </h4>
            <div className="farming-filters-popup__cols">
                <TextInput
                    placeholder={intl.formatMessage({
                        id: 'FARMING_FILTER_FROM',
                    })}
                    value={aprFrom}
                    onChange={setAprFrom}
                />
                <TextInput
                    placeholder={intl.formatMessage({
                        id: 'FARMING_FILTER_TO',
                    })}
                    value={aprTo}
                    onChange={setAprTo}
                />
            </div>
            <div className="farming-filters-popup__footer">
                <button
                    type="button"
                    className="btn btn-tertiary btn-s"
                    onClick={reset}
                    disabled={!resetEnabled}
                >
                    {intl.formatMessage({
                        id: 'FARMING_FILTER_CLEAR',
                    })}
                </button>
                <button
                    type="submit"
                    className="btn btn-primary btn-s"
                    disabled={!applyEnabled}
                >
                    {intl.formatMessage({
                        id: 'FARMING_FILTER_APPLY',
                    })}
                </button>
            </div>
        </form>
    )
}
