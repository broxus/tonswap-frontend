import * as React from 'react'
import BigNumber from 'bignumber.js'
import { reaction } from 'mobx'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { useHistory } from 'react-router-dom'

import { Icon } from '@/components/common/Icon'
import { PoolCreatingParams } from '@/modules/Farming/components/PoolCreatingParams'
import { PoolField } from '@/modules/Farming/components/PoolField'
import { useCreateFarmPoolStore } from '@/modules/Farming/stores/CreateFarmPoolStore'
import { useWallet } from '@/stores/WalletService'

import './index.scss'

export function Create(): JSX.Element {
    const intl = useIntl()
    const history = useHistory()
    const wallet = useWallet()
    const creatingPool = useCreateFarmPoolStore()

    const onChangeFarmToken = (address: string | undefined) => {
        creatingPool.changeData('farmToken', { root: address })
    }

    const onChangeDate = (key: 'farmStart') => (dateString: string | undefined) => {
        creatingPool.changeData(key, { value: dateString })
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
            farmSpeed: value,
            isRewardTotalValid: (
                !rewardTotalAmount.isNaN()
                && rewardTotalAmount.isPositive()
                && !rewardTotalAmount.isZero()
                && rewardTotalAmount.isFinite()
            ),
        })
    }

    const onChangeVesting = (key: 'vestingRatio' | 'vestingPeriod') => (value: string | undefined) => {
        creatingPool.changeData('farmVesting', { ...creatingPool.farmVesting, [key]: value })
    }

    const create = async () => {
        try {
            await creatingPool.create()
            setTimeout(() => {
                history.push('/farming')
            }, 60 * 1000)
        }
        catch (e) {}
    }

    React.useEffect(() => {
        creatingPool.init()
        const logoutDisposer = reaction(() => wallet.address, address => {
            if (!address) {
                history.push('/farming')
            }
        })
        return () => {
            logoutDisposer?.()
            creatingPool.dispose()
        }
    }, [])

    return (
        <div className="container container--small">
            <section className="section">
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
                                        hint={creatingPool.farmToken.symbol != null
                                            ? creatingPool.farmToken.symbol
                                            : intl.formatMessage({
                                                id: 'FARMING_CREATE_FIELD_FARM_TOKEN_ROOT_HINT',
                                            })}
                                        isValid={creatingPool.farmToken.isValid}
                                        label={intl.formatMessage({
                                            id: 'FARMING_CREATE_FIELD_FARM_TOKEN_ROOT_LABEL',
                                        })}
                                        placeholder="0:000000..."
                                        readOnly={creatingPool.isCreating}
                                        value={creatingPool.farmToken.root || ''}
                                        onChange={onChangeFarmToken}
                                    />
                                )}
                            </Observer>

                            <Observer>
                                {() => (
                                    <PoolField
                                        hint={intl.formatMessage({
                                            id: 'FARMING_CREATE_FIELD_FARM_START_HINT',
                                        })}
                                        label={intl.formatMessage({
                                            id: 'FARMING_CREATE_FIELD_FARM_START_LABEL',
                                        })}
                                        isValid={creatingPool.farmStart.isValid}
                                        placeholder="YYYY/MM/DD HH:MM"
                                        readOnly={creatingPool.isCreating}
                                        value={creatingPool.farmStart.value || ''}
                                        onChange={onChangeDate('farmStart')}
                                    />
                                )}
                            </Observer>

                            <Observer>
                                {() => (
                                    <PoolField
                                        hint={intl.formatMessage({
                                            id: 'FARMING_CREATE_FIELD_FARM_VESTING_RATIO_HINT',
                                        })}
                                        inputMode="decimal"
                                        isValid={creatingPool.isVestingValid}
                                        label={intl.formatMessage({
                                            id: 'FARMING_CREATE_FIELD_FARM_VESTING_RATIO_LABEL',
                                        })}
                                        placeholder="50"
                                        readOnly={creatingPool.isCreating}
                                        value={creatingPool.farmVesting.vestingRatio || ''}
                                        onChange={onChangeVesting('vestingRatio')}
                                    />
                                )}
                            </Observer>

                            <Observer>
                                {() => (
                                    <PoolField
                                        hint={intl.formatMessage({
                                            id: 'FARMING_CREATE_FIELD_FARM_VESTING_PERIOD_HINT',
                                        })}
                                        inputMode="decimal"
                                        isValid={creatingPool.isVestingValid}
                                        label={intl.formatMessage({
                                            id: 'FARMING_CREATE_FIELD_FARM_VESTING_PERIOD_LABEL',
                                        })}
                                        placeholder="86400"
                                        readOnly={creatingPool.isCreating}
                                        value={creatingPool.farmVesting.vestingPeriod || ''}
                                        onChange={onChangeVesting('vestingPeriod')}
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
                                                    hint={token.symbol != null
                                                        ? token.symbol
                                                        : intl.formatMessage({
                                                            id: 'FARMING_CREATE_FIELD_REWARD_TOKEN_ROOT_HINT',
                                                        })}
                                                    isValid={token.isValid}
                                                    label={intl.formatMessage({
                                                        id: 'FARMING_CREATE_FIELD_REWARD_TOKEN_ROOT_LABEL',
                                                    })}
                                                    placeholder="0:000000..."
                                                    readOnly={creatingPool.isCreating}
                                                    value={token.root || ''}
                                                    onChange={onChangeRewardTokenRoot(idx)}
                                                />

                                                <PoolField
                                                    hint={token.symbol != null
                                                        ? intl.formatMessage({
                                                            id: 'FARMING_CREATE_FIELD_TOKEN_TOTAL_REWARD_HINT',
                                                        }, { symbol: token.symbol })
                                                        : intl.formatMessage({
                                                            id: 'FARMING_CREATE_FIELD_TOTAL_REWARD_HINT',
                                                        })}
                                                    inputMode="decimal"
                                                    isValid={token.isRewardTotalValid}
                                                    label={intl.formatMessage({
                                                        id: 'FARMING_CREATE_FIELD_TOTAL_REWARD_LABEL',
                                                    })}
                                                    placeholder="0.0"
                                                    readOnly={creatingPool.isCreating}
                                                    value={token.farmSpeed || ''}
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
                                        className="btn btn-primary btn-lg form-submit btn-block"
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
        </div>
    )
}
