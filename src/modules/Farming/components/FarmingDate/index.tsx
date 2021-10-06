import * as React from 'react'
import { useIntl } from 'react-intl'
import { DateTime } from 'luxon'

import { FarmingStatus, getFarmingStatus } from '@/modules/Farming/utils'

import './index.scss'

type Props = {
    startTime: number
    endTime?: number
}

export function FarmingDate({
    startTime,
    endTime,
}: Props): JSX.Element {
    const intl = useIntl()
    const status = getFarmingStatus(startTime, endTime)
    let label,
        date

    if (status === FarmingStatus.WAITING) {
        label = intl.formatMessage({
            id: 'FARMING_DATE_WAITING',
        }, {
            date: DateTime.fromMillis(startTime).toRelative(),
        })
        date = DateTime.fromMillis(startTime).toFormat('MMM dd, yyyy, HH:mm')
    }

    if (status === FarmingStatus.ACTIVE && !endTime) {
        label = intl.formatMessage({ id: 'FARMING_DATE_INFINITE' })
        date = DateTime.fromMillis(startTime).toFormat('MMM dd, yyyy, HH:mm')
    }

    if (status === FarmingStatus.ACTIVE && endTime) {
        label = intl.formatMessage({
            id: 'FARMING_DATE_ACTIVE',
        }, {
            date: DateTime.fromMillis(endTime).toRelative(),
        })
        date = DateTime.fromMillis(endTime).toFormat('MMM dd, yyyy, HH:mm')
    }

    if (status === FarmingStatus.ENDED && endTime) {
        label = intl.formatMessage({ id: 'FARMING_DATE_ENDED' })
        date = DateTime.fromMillis(endTime).toFormat('MMM dd, yyyy, HH:mm')
    }

    return (
        <div>
            {label}
            <div className="farming-date">{date}</div>
        </div>
    )
}
