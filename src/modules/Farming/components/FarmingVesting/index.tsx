import * as React from 'react'
import BigNumber from 'bignumber.js'
import { useIntl } from 'react-intl'

import { formatDate } from '@/utils'

type Props = {
    vestingRatio?: number;
    vestingPeriodDays?: string;
    vestingTime?: number;
}

export function FarmingVesting({
    vestingRatio,
    vestingPeriodDays,
    vestingTime,
}: Props): JSX.Element {
    const intl = useIntl()
    const nullMessage = intl.formatMessage({
        id: 'FARMING_VESTING_NULL',
    })
    const vestingTimeFormated = vestingTime && vestingTime > 0
        ? formatDate(vestingTime)
        : undefined

    return (
        <div className="farming-panel">
            <h2 className="farming-panel__title">
                {intl.formatMessage({
                    id: 'FARMING_VESTING_TITLE',
                })}
            </h2>
            <div className="farming-map">
                <div className="farming-map__label">
                    {intl.formatMessage({
                        id: 'FARMING_VESTING_RATIO_TITLE',
                    })}
                </div>
                <div className="farming-map__value">
                    {
                        vestingRatio === undefined
                            ? nullMessage
                            : intl.formatMessage({
                                id: 'FARMING_VESTING_RATIO_VALUE',
                            }, {
                                value: new BigNumber(vestingRatio)
                                    .div(10)
                                    .decimalPlaces(1, BigNumber.ROUND_DOWN)
                                    .toFixed(),
                            })
                    }
                </div>
                <div className="farming-map__label">
                    {intl.formatMessage({
                        id: 'FARMING_VESTING_PERIOD_TITLE',
                    })}
                </div>
                <div className="farming-map__value">
                    {
                        vestingPeriodDays === undefined
                            ? nullMessage
                            : intl.formatMessage({
                                id: 'FARMING_VESTING_PERIOD_VALUE',
                            }, {
                                days: vestingPeriodDays,
                            })
                    }
                </div>
                <div className="farming-map__label">
                    {intl.formatMessage({
                        id: 'FARMING_VESTING_VESTING_UNTIL',
                    })}
                </div>
                <div className="farming-map__value">
                    {vestingTimeFormated || nullMessage}
                </div>
            </div>
        </div>
    )
}
