import * as React from 'react'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import BigNumber from 'bignumber.js'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { useCreateFarmPoolStore } from '@/modules/Farming/stores/CreateFarmPoolStore'
import { formattedAmount } from '@/utils'

function CreatingParams(): JSX.Element {
    const intl = useIntl()
    const creatingPool = useCreateFarmPoolStore()

    const startValid = creatingPool.farmStart.date != null && creatingPool.farmStart.isValid

    return (
        <>
            {(
                (creatingPool.farmToken.root != null && creatingPool.farmToken.isValid)
                || creatingPool.rewardTokens.some(({ isValid }) => isValid)
                || startValid
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

                    {creatingPool.rewardTokens.map((token, idx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <React.Fragment key={idx}>
                            {token.isValid && (
                                // eslint-disable-next-line react/no-array-index-key
                                <div key={`rewardToken-${idx}`}>
                                    <div className="form-row">
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
                                    <div className="form-row">
                                        <div>
                                            {intl.formatMessage({
                                                id: 'FARMING_CREATE_POOL_PARAMS_REWARD_TOKEN_DAY',
                                            }, {
                                                index: idx + 1,
                                            })}
                                        </div>
                                        <div>
                                            {formattedAmount(
                                                new BigNumber(token.farmSpeed || 0).times(86400).times(30).toFixed(),
                                                0,
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </React.Fragment>
                    ))}
                </div>
            )}
        </>
    )
}

export const PoolCreatingParams = observer(CreatingParams)
