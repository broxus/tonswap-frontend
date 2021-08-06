import * as React from 'react'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { useCreateFarmPoolStore } from '@/modules/Farming/stores/CreateFarmPoolStore'
import { farmDeposit, farmSpeed } from '@/modules/Farming/utils'


function CreatingParams(): JSX.Element {
    const intl = useIntl()
    const creatingPool = useCreateFarmPoolStore()

    const startValid = creatingPool.farmStart.date != null && creatingPool.farmStart.isValid
    const endValid = creatingPool.farmEnd.date != null && creatingPool.farmEnd.isValid

    return (
        <>
            {(
                (creatingPool.farmToken.root != null && creatingPool.farmToken.isValid)
                || creatingPool.rewardTokens.some(({ isValid }) => isValid)
                || startValid
                || endValid
            ) && (
                <div className="form-rows">
                    <div className="form-row">
                        <div>
                            {intl.formatMessage({
                                id: 'FARMING_CREATE_POOL_SUBTITLE_PARAMS',
                            })}
                        </div>
                    </div>

                    {(creatingPool.farmToken.root != null && creatingPool.farmToken.isValid) && (
                        <div key="farmToken" className="form-row">
                            <div>
                                {intl.formatMessage({
                                    id: 'FARMING_CREATE_POOL_PARAMS_FARM_TOKEN',
                                })}
                            </div>
                            <div>
                                <AccountExplorerLink address={creatingPool.farmToken.root}>
                                    {creatingPool.farmToken.symbol}
                                </AccountExplorerLink>
                            </div>
                        </div>
                    )}

                    {startValid && (
                        <React.Fragment key="farmStart">
                            <div className="form-row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'FARMING_CREATE_POOL_PARAMS_FARM_START_LOCAL',
                                    })}
                                </div>
                                <div>
                                    {DateTime.fromJSDate(creatingPool.farmStart.date as Date).toFormat('MMM dd, yyyy, HH:mm')}
                                </div>
                            </div>

                            <div className="form-row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'FARMING_CREATE_POOL_PARAMS_FARM_START_UTC',
                                    })}
                                </div>
                                <div>
                                    {DateTime.fromJSDate(creatingPool.farmStart.date as Date).toUTC(undefined, {
                                        keepLocalTime: false,
                                    }).toFormat('MMM dd, yyyy, HH:mm')}
                                </div>
                            </div>
                        </React.Fragment>
                    )}

                    {endValid && (
                        <React.Fragment key="farmEnd">
                            <div className="form-row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'FARMING_CREATE_POOL_PARAMS_FARM_END_LOCAL',
                                    })}
                                </div>
                                <div>
                                    {DateTime.fromJSDate(creatingPool.farmEnd.date as Date).toFormat('MMM dd, yyyy, HH:mm')}
                                </div>
                            </div>
                            <div className="form-row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'FARMING_CREATE_POOL_PARAMS_FARM_END_UTC',
                                    })}
                                </div>
                                <div>
                                    {DateTime.fromJSDate(creatingPool.farmEnd.date as Date).toUTC(undefined, {
                                        keepLocalTime: false,
                                    }).toFormat('MMM dd, yyyy, HH:mm')}
                                </div>
                            </div>
                        </React.Fragment>
                    )}

                    {(startValid && endValid) && (
                        <div key="period" className="form-row">
                            <div>
                                {intl.formatMessage({
                                    id: 'FARMING_CREATE_POOL_PARAMS_FARM_PERIOD',
                                })}
                            </div>
                            <div>
                                {intl.formatMessage({
                                    id: 'FARMING_CREATE_POOL_PARAMS_FARM_PERIOD_VALUE',
                                }, {
                                    days: DateTime.fromJSDate(creatingPool.farmEnd.date as Date)
                                        .diff(DateTime.fromJSDate(creatingPool.farmStart.date as Date), [
                                            'days',
                                        ]).toObject().days?.toFixed(0),
                                })}
                            </div>
                        </div>
                    )}

                    {creatingPool.rewardTokens.map((token, idx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <React.Fragment key={idx}>
                            {token.isValid && (
                                // eslint-disable-next-line react/no-array-index-key
                                <div key={`rewardToken-${idx}`} className="form-row">
                                    <div>
                                        {intl.formatMessage({
                                            id: 'FARMING_CREATE_POOL_PARAMS_REWARD_TOKEN',
                                        }, {
                                            index: idx + 1,
                                        })}
                                    </div>
                                    <div>
                                        {token.root !== undefined && (
                                            <AccountExplorerLink address={token.root}>
                                                {token.symbol}
                                            </AccountExplorerLink>
                                        )}
                                    </div>
                                </div>
                            )}
                            {(token.isValid && startValid && endValid && token.isRewardTotalValid) && (
                                // eslint-disable-next-line react/no-array-index-key
                                <div key={`farmSpeed-${token.root}`} className="form-row">
                                    <div>
                                        {intl.formatMessage({
                                            id: 'FARMING_CREATE_POOL_PARAMS_REWARD_TOKEN_FARM_SPEED',
                                        }, {
                                            index: idx + 1,
                                        })}
                                    </div>
                                    <div>
                                        {intl.formatMessage({
                                            id: 'FARMING_CREATE_POOL_PARAMS_REWARD_TOKEN_FARM_SPEED_VALUE',
                                        }, {
                                            symbol: token.symbol,
                                            value: farmSpeed(
                                                creatingPool.farmStart.date as Date,
                                                creatingPool.farmEnd.date as Date,
                                                token.rewardTotalAmount,
                                                token.decimals,
                                            ).toString(10),
                                        })}
                                    </div>
                                </div>
                            )}
                            {(token.isValid && startValid && endValid && token.isRewardTotalValid) && (
                                // eslint-disable-next-line react/no-array-index-key
                                <div key={`farmDeposit-${idx}`} className="form-row">
                                    <div>
                                        {intl.formatMessage({
                                            id: 'FARMING_CREATE_POOL_PARAMS_REWARD_TOKEN_FARM_DEPOSIT',
                                        }, {
                                            index: idx + 1,
                                        })}
                                    </div>
                                    <div>
                                        {intl.formatMessage({
                                            id: 'FARMING_CREATE_POOL_PARAMS_REWARD_TOKEN_FARM_DEPOSIT_VALUE',
                                        }, {
                                            symbol: token.symbol,
                                            value: farmDeposit(
                                                creatingPool.farmStart.date as Date,
                                                creatingPool.farmEnd.date as Date,
                                                token.rewardTotalAmount,
                                                token.decimals,
                                            ).toString(10),
                                        })}
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {creatingPool.isValid && (
                <div className="form-create-farm-pool__notes">
                    <p>
                        {intl.formatMessage({
                            id: 'FARMING_CREATE_POOL_VALID_STATE_CREATION_NOTE',
                        })}
                    </p>
                    <p>
                        {intl.formatMessage({
                            id: 'FARMING_CREATE_POOL_VALID_STATE_DEPOSIT_NOTE',
                        }, {
                            tokensDeposits: creatingPool.rewardTokens.reduce(
                                (acc, token, idx) => ((
                                    token.isValid
                                    && startValid
                                    && endValid
                                    && token.isRewardTotalValid
                                ) ? acc.concat(`${idx > 0 ? ', ' : ''}${farmDeposit(
                                        creatingPool.farmStart.date as Date,
                                        creatingPool.farmEnd.date as Date,
                                        token.rewardTotalAmount,
                                        token.decimals,
                                    ).toString(10)} ${token.symbol}`) : ''), '',
                            ),
                        })}
                    </p>
                </div>
            )}
        </>
    )
}

export const PoolCreatingParams = observer(CreatingParams)
