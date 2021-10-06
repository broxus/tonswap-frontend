import * as React from 'react'
import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'
import { useIntl } from 'react-intl'

type Props = {
    vestingRatio: string;
    vestingPeriodDays: string;
    vestingTime?: number;
}

export function FarmingVesting({
    vestingRatio,
    vestingPeriodDays,
    vestingTime,
}: Props): JSX.Element {
    const intl = useIntl()
    const vestingTimeFormated = vestingTime && vestingTime > 0
        ? DateTime.fromMillis(vestingTime).toFormat('MMM dd, yyyy, HH:mm')
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
                    {intl.formatMessage({
                        id: 'FARMING_VESTING_RATIO_VALUE',
                    }, {
                        value: new BigNumber(vestingRatio)
                            .div(10)
                            .decimalPlaces(1, BigNumber.ROUND_DOWN)
                            .toFixed(),
                    })}
                </div>
                <div className="farming-map__label">
                    {intl.formatMessage({
                        id: 'FARMING_VESTING_PERIOD_TITLE',
                    })}
                </div>
                <div className="farming-map__value">
                    {intl.formatMessage({
                        id: 'FARMING_VESTING_PERIOD_VALUE',
                    }, {
                        days: vestingPeriodDays,
                    })}
                </div>
                <div className="farming-map__label">
                    {intl.formatMessage({
                        id: 'FARMING_VESTING_VESTING_UNTIL',
                    })}
                </div>
                <div className="farming-map__value">
                    {vestingTimeFormated || intl.formatMessage({
                        id: 'FARMING_VESTING_NOTHING',
                    })}
                </div>
            </div>
        </div>
    )
}
