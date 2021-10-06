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
    onOpenTokenList?: () => void
    onCloseTokenList?: () => void
    onSubmit?: (filter: FarmingPoolFilter) => void
}

export function FarmingFiltersPopup({
    filter,
    lowBalanceEnabled,
    onOpenTokenList,
    onCloseTokenList,
    onSubmit,
}: Props): JSX.Element {
    const intl = useIntl()
    const [filterState, setFilterState] = React.useState<FarmingPoolFilter>({
        isLowBalance: lowBalanceEnabled,
    })

    const changeFilter = (key: keyof FarmingPoolFilter) => (
        (value: FarmingPoolFilter[typeof key]) => {
            setFilterState(prev => ({
                ...prev,
                [key]: value,
            }))
        }
    )

    const changeState = (state?: FarmingPoolFilter['state']) => {
        changeFilter('state')(state)
    }

    const changeOwnerInclude = (state?: FarmingPoolFilter['ownerInclude']) => {
        changeFilter('ownerInclude')(state)
    }

    const submit = () => {
        if (onSubmit) {
            onSubmit(filterState)
        }
    }

    const clear = () => {
        setFilterState({})
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

    React.useEffect(() => {
        setFilterState(filter || {})
    }, [filter])

    return (
        <div className="farming-filters-popup">
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
                    root={filterState.leftRoot}
                    onOpen={onOpenTokenList}
                    onClose={onCloseTokenList}
                    onSelect={changeFilter('leftRoot')}
                />

                <TokenSelector
                    root={filterState.rightRoot}
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
                        checked={filterState.state === 'awaiting'}
                        onChange={onChangeAwaiting}
                    />
                </div>
                <div>
                    <Checkbox
                        label={intl.formatMessage({
                            id: 'FARMING_FILTER_ACTIVE',
                        })}
                        checked={filterState.state === 'active'}
                        onChange={onChangeActive}
                    />
                </div>
                <div>
                    <Checkbox
                        label={intl.formatMessage({
                            id: 'FARMING_FILTER_UNACTIVE',
                        })}
                        checked={filterState.state === 'noActive'}
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
                        checked={filterState.ownerInclude === true}
                        onChange={onChangeWithMyFarming}
                    />
                </div>
                <div>
                    <Checkbox
                        label={intl.formatMessage({
                            id: 'FARMING_FILTER_WITHOUT_MY_FARMING',
                        })}
                        checked={filterState.ownerInclude === false}
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
                                checked={filterState.isLowBalance === true}
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
                    value={filterState.tvlFrom}
                    onChange={changeFilter('tvlFrom')}
                />
                <TextInput
                    placeholder={intl.formatMessage({
                        id: 'FARMING_FILTER_TO',
                    })}
                    value={filterState.tvlTo}
                    onChange={changeFilter('tvlTo')}
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
                    value={filterState.aprFrom}
                    onChange={changeFilter('aprFrom')}
                />
                <TextInput
                    placeholder={intl.formatMessage({
                        id: 'FARMING_FILTER_TO',
                    })}
                    value={filterState.aprTo}
                    onChange={changeFilter('aprTo')}
                />
            </div>
            <div className="farming-filters-popup__footer">
                <button
                    type="button"
                    className="btn btn-tertiary btn-s"
                    onClick={clear}
                >
                    {intl.formatMessage({
                        id: 'FARMING_FILTER_CLEAR',
                    })}
                </button>
                <button
                    type="button"
                    className="btn btn-primary btn-s"
                    onClick={submit}
                >
                    {intl.formatMessage({
                        id: 'FARMING_FILTER_APPLY',
                    })}
                </button>
            </div>
        </div>
    )
}
