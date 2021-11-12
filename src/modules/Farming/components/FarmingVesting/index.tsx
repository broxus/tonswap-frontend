import * as React from 'react'
import BigNumber from 'bignumber.js'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { Tooltip } from '@/components/common/Tooltip'
import { formatDateUTC } from '@/utils'

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
    const ratioRef = React.useRef<HTMLDivElement | null>(null)
    const periodRef = React.useRef<HTMLDivElement | null>(null)
    const untilRef = React.useRef<HTMLDivElement | null>(null)
    const nullMessage = intl.formatMessage({
        id: 'FARMING_VESTING_NULL',
    })
    const vestingTimeFormatted = vestingTime && vestingTime > 0
        ? formatDateUTC(vestingTime)
        : undefined

    return (
        <div className="farming-panel">
            <h2 className="farming-panel__title">
                {intl.formatMessage({
                    id: 'FARMING_VESTING_TITLE',
                })}
            </h2>
            <div className="farming-map">
                <div className="farming-map__item">
                    <div className="farming-map__label">
                        {intl.formatMessage({
                            id: 'FARMING_VESTING_RATIO_TITLE',
                        })}
                        <div className="farming-map__info" ref={ratioRef}>
                            <Icon icon="infoFill" />
                        </div>
                        <Tooltip target={ratioRef} alignY="top" width={270}>
                            {intl.formatMessage({
                                id: 'FARMING_VESTING_RATIO_HINT',
                            })}
                        </Tooltip>
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
                </div>

                <div className="farming-map__item">
                    <div className="farming-map__label">
                        {intl.formatMessage({
                            id: 'FARMING_VESTING_PERIOD_TITLE',
                        })}
                        <div className="farming-map__info" ref={periodRef}>
                            <Icon icon="infoFill" />
                        </div>
                        <Tooltip target={periodRef} alignY="top" width={270}>
                            {intl.formatMessage({
                                id: 'FARMING_VESTING_PERIOD_HINT',
                            })}
                        </Tooltip>
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
                </div>

                <div className="farming-map__item">
                    <div className="farming-map__label">
                        {intl.formatMessage({
                            id: 'FARMING_VESTING_VESTING_UNTIL',
                        })}
                        <div className="farming-map__info" ref={untilRef}>
                            <Icon icon="infoFill" />
                        </div>
                        <Tooltip target={untilRef} alignY="top" width={270}>
                            {intl.formatMessage({
                                id: 'FARMING_VESTING_VESTING_HINT',
                            })}
                        </Tooltip>
                    </div>
                    <div className="farming-map__value">
                        {vestingTimeFormatted || nullMessage}
                    </div>
                </div>
            </div>
        </div>
    )
}
