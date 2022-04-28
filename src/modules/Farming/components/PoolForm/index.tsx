import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { FarmingPoolStoreData, FarmPool } from '@/modules/Farming/types'
import { useFarmingPool } from '@/modules/Farming/stores/FarmingPoolStore'
import { formattedAmount } from '@/utils'
import {
    isClaimValid,
    isClosePoolValid,
    isCreatePeriodValid,
    isDepositValid,
    isWithdrawAllValid,
} from '@/modules/Farming/utils'

import './index.scss'

type Props = {
    pool: FarmPool;
}

export function PoolForm({ pool }: Props): JSX.Element {
    const intl = useIntl()

    const farmingPool = React.useMemo(() => useFarmingPool(pool), [])

    const onChange = (key: keyof FarmingPoolStoreData) => (event: React.ChangeEvent<HTMLInputElement>) => {
        farmingPool.changeData(key, event.target.value)
    }

    const onChangeAdminDeposit = (idx: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const adminDeposit = farmingPool.adminDeposit.slice()
        adminDeposit[idx] = event.target.value
        farmingPool.changeData('adminDeposit', adminDeposit)
    }

    const onChangeAdminRPS = (idx: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const adminRPS = farmingPool.adminCreatePeriodRPS.slice()
        adminRPS[idx] = event.target.value
        farmingPool.changeData('adminCreatePeriodRPS', adminRPS)
    }

    const onAdminDepositToken = (idx: number) => () => farmingPool.adminDepositToken(idx)

    React.useEffect(() => {
        (async () => {
            await farmingPool.init()
        })()
        return () => {
            farmingPool.dispose()
        }
    }, [])

    return (
        <Observer>
            {() => (
                <>
                    <div className="farming-pool-form">
                        <p className="farming-pool-form__text">
                            {intl.formatMessage({
                                id: 'FARMING_POOL_FORM_WALLET_BALANCE_TEXT',
                            }, {
                                balance: formattedAmount(
                                    farmingPool.userWalletBalance,
                                    pool.tokenDecimals,
                                ),
                                symbol: pool.tokenSymbol,
                            })}
                        </p>
                        <div className="farming-pool-form__field-wrapper">
                            <div className="farming-pool-form__swap-amount">
                                <input
                                    type="text"
                                    className="form-input farming-pool-form__input"
                                    placeholder={intl.formatMessage({
                                        id: 'FARMING_POOL_FORM_DEPOSIT_AMOUNT_PLACEHOLDER',
                                    })}
                                    value={farmingPool.userDeposit || ''}
                                    disabled={farmingPool.isUserDepositing}
                                    onChange={onChange('userDeposit')}
                                />
                                <Button
                                    className="farming-pool-form__swap-amount-btn"
                                    disabled={farmingPool.isUserDepositing}
                                    onClick={farmingPool.maxDeposit}
                                >
                                    {intl.formatMessage({
                                        id: 'FARMING_POOL_FORM_MAX_AMOUNT_DEPOSIT_BTN_TEXT',
                                    })}
                                </Button>
                            </div>
                            <Button
                                disabled={!isDepositValid(
                                    farmingPool.userDeposit,
                                    farmingPool.userWalletBalance,
                                    pool.tokenDecimals,
                                ) || farmingPool.isUserDepositing}
                                size="sm"
                                type="primary"
                                onClick={farmingPool.depositToken}
                            >
                                {intl.formatMessage({
                                    id: farmingPool.isUserDepositing
                                        ? 'FARMING_POOL_FORM_DEPOSITING_BTN_TEXT'
                                        : 'FARMING_POOL_FORM_DEPOSIT_BTN_TEXT',
                                })}
                            </Button>
                            <Button
                                disabled={!isClaimValid(
                                    pool.userReward,
                                ) || farmingPool.isUserDepositing}
                                size="sm"
                                type="primary"
                                onClick={farmingPool.withdrawUnclaimed}
                            >
                                {intl.formatMessage({
                                    id: 'FARMING_POOL_FORM_CLAIM_BTN_TEXT',
                                })}
                            </Button>
                            <Button
                                disabled={!isWithdrawAllValid(
                                    pool.userBalance,
                                ) || farmingPool.isUserDepositing}
                                size="sm"
                                type="primary"
                                onClick={farmingPool.withdrawAll}
                            >
                                {intl.formatMessage({
                                    id: 'FARMING_POOL_FORM_WITHDRAW_BTN_TEXT',
                                })}
                            </Button>
                        </div>
                    </div>

                    {farmingPool.isAdmin && (
                        <>
                            <div className="farming-pool-form">
                                <p className="farming-pool-form__text">
                                    {intl.formatMessage({
                                        id: 'FARMING_POOL_FORM_ADMIN_TEXT',
                                    })}
                                </p>
                                {pool.rewardTokenSymbol.map((symbol, idx) => {
                                    const adminDeposit = farmingPool.adminDeposit.length > 0
                                        ? farmingPool.adminDeposit[idx]
                                        : undefined
                                    const adminWalletBalance = farmingPool.adminWalletBalance.length > 0
                                        ? farmingPool.adminWalletBalance[idx]
                                        : '0'
                                    return (
                                        <React.Fragment key={symbol}>
                                            <div className="farming-pool-form__field-wrapper">
                                                <div className="farming-pool-form__swap-amount">
                                                    <input
                                                        type="text"
                                                        className="form-input farming-pool-form__input"
                                                        placeholder={intl.formatMessage({
                                                            id: 'FARMING_POOL_FORM_DEPOSIT_AMOUNT_PLACEHOLDER',
                                                        })}
                                                        value={adminDeposit || ''}
                                                        disabled={farmingPool.isAdminDepositing}
                                                        onChange={onChangeAdminDeposit(idx)}
                                                    />
                                                </div>
                                                <Button
                                                    disabled={!isDepositValid(
                                                        adminDeposit,
                                                        adminWalletBalance,
                                                        pool.rewardTokenDecimals[idx],
                                                    ) || farmingPool.isAdminDepositing}
                                                    size="sm"
                                                    type="primary"
                                                    onClick={onAdminDepositToken(idx)}
                                                >
                                                    {intl.formatMessage({
                                                        id: farmingPool.isAdminDepositing
                                                            ? 'FARMING_POOL_FORM_DEPOSITING_TOKEN_BTN_TEXT'
                                                            : 'FARMING_POOL_FORM_DEPOSIT_TOKEN_BTN_TEXT',
                                                    }, {
                                                        symbol,
                                                    })}
                                                </Button>
                                            </div>
                                            <p className="farming-pool-form__hint">
                                                {intl.formatMessage({
                                                    id: 'FARMING_POOL_FORM_TOKEN_WALLET_BALANCE_TEXT',
                                                }, {
                                                    amount: formattedAmount(
                                                        adminWalletBalance,
                                                        pool.rewardTokenDecimals[idx],
                                                    ),
                                                    symbol,
                                                })}
                                            </p>
                                        </React.Fragment>
                                    )
                                })}
                                <div className="farming-pool-form__field-wrapper">
                                    <div className="farming-pool-form__swap-amount">
                                        <input
                                            type="text"
                                            className="form-input farming-pool-form__input"
                                            placeholder={intl.formatMessage({
                                                id: 'FARMING_POOL_FORM_CREATE_PERIOD_START',
                                            })}
                                            value={farmingPool.adminCreatePeriodStartTime || ''}
                                            disabled={farmingPool.isAdminDepositing}
                                            onChange={onChange('adminCreatePeriodStartTime')}
                                        />
                                    </div>
                                    {pool.rewardTokenSymbol.map((symbol, idx) => (
                                        <React.Fragment key={`period-${symbol}`}>
                                            <div className="farming-pool-form__swap-amount">
                                                <input
                                                    type="text"
                                                    className="form-input farming-pool-form__input"
                                                    placeholder={intl.formatMessage({
                                                        id: 'FARMING_POOL_FORM_CREATE_PERIOD_RPS',
                                                    }, {
                                                        symbol,
                                                    })}
                                                    value={farmingPool.adminCreatePeriodRPS[idx] || ''}
                                                    disabled={farmingPool.isAdminDepositing}
                                                    onChange={onChangeAdminRPS(idx)}
                                                />
                                            </div>
                                        </React.Fragment>
                                    ))}
                                    <Button
                                        disabled={farmingPool.isAdminDepositing
                                        || !isCreatePeriodValid(
                                            farmingPool.adminCreatePeriodStartTime,
                                            farmingPool.adminCreatePeriodRPS,
                                        )}
                                        size="sm"
                                        type="primary"
                                        onClick={farmingPool.onAdminCreatePeriod}
                                    >
                                        {intl.formatMessage({
                                            id: 'FARMING_POOL_FORM_CREATE_PERIOD',
                                        })}
                                    </Button>
                                </div>
                                <div className="farming-pool-form__field-wrapper">
                                    <div className="farming-pool-form__swap-amount">
                                        <input
                                            type="text"
                                            className="form-input farming-pool-form__input"
                                            placeholder={intl.formatMessage({
                                                id: 'FARMING_POOL_FORM_SET_END_TIME',
                                            })}
                                            value={farmingPool.adminSetEndTime || ''}
                                            disabled={farmingPool.isAdminDepositing}
                                            onChange={onChange('adminSetEndTime')}
                                        />
                                    </div>
                                    <Button
                                        disabled={farmingPool.isAdminDepositing
                                        || !isClosePoolValid(
                                            farmingPool.adminSetEndTime,
                                        )}
                                        size="sm"
                                        type="primary"
                                        onClick={farmingPool.onAdminSetEndTime}
                                    >
                                        {intl.formatMessage({
                                            id: 'FARMING_POOL_FORM_CLOSE_POOL',
                                        })}
                                    </Button>
                                </div>
                            </div>
                            <div className="farming-pool-form__actions">
                                <Button
                                    className="swap-acc-table-frame__submit"
                                    disabled={farmingPool.isAdminWithdrawUnclaiming}
                                    size="sm"
                                    type="primary"
                                    onClick={farmingPool.adminWithdrawUnclaimedAll}
                                >
                                    {intl.formatMessage({
                                        id: 'FARMING_POOL_FORM_WITHDRAW_UNCLAIMED_BTN_TEXT',
                                    })}
                                </Button>
                            </div>
                        </>
                    )}
                </>
            )}
        </Observer>
    )
}
