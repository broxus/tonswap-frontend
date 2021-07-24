import * as React from 'react'
import BigNumber from 'bignumber.js'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { useHistory } from 'react-router-dom'

import { Icon } from '@/components/common/Icon'
import { PoolCreatingParams } from '@/modules/Farming/components/PoolCreatingParams'
import { PoolField } from '@/modules/Farming/components/PoolField'
import { useCreateFarmPoolStore } from '@/modules/Farming/stores/CreateFarmPoolStore'
import { CreateFarmPoolStoreDataProp } from '@/modules/Farming/types'
import { noop } from '@/utils'


export function Create(): JSX.Element {
    const intl = useIntl()
    const history = useHistory()
    const creatingPool = useCreateFarmPoolStore()

    const onChangeFarmToken = (address: string | undefined) => {
        creatingPool.changeData(
            CreateFarmPoolStoreDataProp.FARM_TOKEN,
            { root: address },
        )
    }

    const onChangeDate = (field: CreateFarmPoolStoreDataProp) => (dateString: string | undefined) => {
        creatingPool.changeData(field, {
            value: dateString,
        })
    }

    const onChangeRewardTokenRoot = (idx: number) => (value: string | undefined) => {
        creatingPool.updateRewardToken(idx, {
            decimals: undefined,
            isValid: undefined,
            root: value,
            symbol: undefined,
        })
    }

    const onChangeRewardTokenRewardAmount = (idx: number) => (value: string | undefined) => {
        const rewardTotalAmount = new BigNumber(value || '0')
        creatingPool.updateRewardToken(idx, {
            rewardTotal: value,
            rewardTotalAmount,
            isRewardTotalValid: (
                !rewardTotalAmount.isNaN()
                && rewardTotalAmount.isPositive()
                && !rewardTotalAmount.isZero()
                && rewardTotalAmount.isFinite()
            ),
        })
    }

    const create = () => {
        creatingPool.create().then(() => {
            window.setTimeout(async () => {
                history.push('/farming')
            }, 60 * 1000)
        }).catch(noop)
    }

    React.useEffect(() => {
        creatingPool.init()
        return () => {
            creatingPool.dispose()
        }
    }, [])

    return (
        <section className="section section--small">
            <div className="card">
                <div className="card__wrap">
                    <header className="card__header">
                        <h2 className="card-title">
                            {intl.formatMessage({
                                id: 'FARMING_CREATE_HEADER_TITLE',
                            })}
                        </h2>
                    </header>

                    <div className="form form-create-farm-pool">
                        <Observer>
                            {() => (
                                <PoolField
                                    autoFocus
                                    label={intl.formatMessage({
                                        id: 'FARMING_CREATE_FIELD_FARM_TOKEN_ROOT_LABEL',
                                    })}
                                    hint={creatingPool.farmToken.symbol != null
                                        ? creatingPool.farmToken.symbol
                                        : intl.formatMessage({
                                            id: 'FARMING_CREATE_FIELD_FARM_TOKEN_ROOT_HINT',
                                        })}
                                    placeholder="0:000000..."
                                    isValid={creatingPool.farmToken.isValid}
                                    readOnly={creatingPool.isCreating}
                                    value={creatingPool.farmToken.root || ''}
                                    onChange={onChangeFarmToken}
                                />
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <PoolField
                                    label={intl.formatMessage({
                                        id: 'FARMING_CREATE_FIELD_FARM_START_LABEL',
                                    })}
                                    hint={intl.formatMessage({
                                        id: 'FARMING_CREATE_FIELD_FARM_START_HINT',
                                    })}
                                    placeholder="YYYY/MM/DD HH:MM"
                                    isValid={creatingPool.farmStart.isValid}
                                    readOnly={creatingPool.isCreating}
                                    value={creatingPool.farmStart.value || ''}
                                    onChange={onChangeDate(CreateFarmPoolStoreDataProp.FARM_START)}
                                />
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <PoolField
                                    label={intl.formatMessage({
                                        id: 'FARMING_CREATE_FIELD_FARM_END_LABEL',
                                    })}
                                    hint={intl.formatMessage({
                                        id: 'FARMING_CREATE_FIELD_FARM_END_HINT',
                                    })}
                                    placeholder="YYYY/MM/DD HH:MM"
                                    isValid={creatingPool.farmEnd.isValid}
                                    readOnly={creatingPool.isCreating}
                                    value={creatingPool.farmEnd.value || ''}
                                    onChange={onChangeDate(CreateFarmPoolStoreDataProp.FARM_END)}
                                />
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <>
                                    {creatingPool.rewardTokens.map((token, idx) => (
                                        // eslint-disable-next-line react/no-array-index-key
                                        <React.Fragment key={idx}>
                                            <PoolField
                                                label={intl.formatMessage({
                                                    id: 'FARMING_CREATE_FIELD_REWARD_TOKEN_ROOT_LABEL',
                                                })}
                                                hint={token.symbol != null
                                                    ? token.symbol
                                                    : intl.formatMessage({
                                                        id: 'FARMING_CREATE_FIELD_REWARD_TOKEN_ROOT_HINT',
                                                    })}
                                                placeholder="0:000000..."
                                                isValid={token.isValid}
                                                readOnly={creatingPool.isCreating}
                                                value={token.root || ''}
                                                onChange={onChangeRewardTokenRoot(idx)}
                                            />

                                            <PoolField
                                                label={intl.formatMessage({
                                                    id: 'FARMING_CREATE_FIELD_TOTAL_REWARD_LABEL',
                                                })}
                                                hint={token.symbol != null
                                                    ? intl.formatMessage({
                                                        id: 'FARMING_CREATE_FIELD_TOKEN_TOTAL_REWARD_HINT',
                                                    }, { symbol: token.symbol })
                                                    : intl.formatMessage({
                                                        id: 'FARMING_CREATE_FIELD_TOTAL_REWARD_HINT',
                                                    })}
                                                placeholder="0.0"
                                                isValid={token.isRewardTotalValid}
                                                readOnly={creatingPool.isCreating}
                                                value={token.rewardTotal || ''}
                                                onChange={onChangeRewardTokenRewardAmount(idx)}
                                            />
                                        </React.Fragment>
                                    ))}
                                </>
                            )}
                        </Observer>

                        <div className="form-create-farm-pool__actions">
                            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                            <a onClick={creatingPool.addRewardToken}>
                                {intl.formatMessage({
                                    id: 'FARMING_CREATE_ADD_REWARD_TOKEN_LINK_TEXT',
                                })}
                            </a>
                        </div>

                        <PoolCreatingParams />

                        <Observer>
                            {() => (
                                <button
                                    type="button"
                                    className="btn btn-light btn-lg form-submit btn-block"
                                    aria-disabled={creatingPool.isCreating || !creatingPool.isValid}
                                    disabled={creatingPool.isCreating || !creatingPool.isValid}
                                    onClick={create}
                                >
                                    {creatingPool.isCreating ? (
                                        <div className="popup-main__loader">
                                            <Icon icon="loader" />
                                        </div>
                                    ) : intl.formatMessage({
                                        id: 'FARMING_CREATE_BTN_TEXT_SUBMIT',
                                    })}
                                </button>
                            )}
                        </Observer>
                    </div>
                </div>
            </div>
        </section>
    )
}
