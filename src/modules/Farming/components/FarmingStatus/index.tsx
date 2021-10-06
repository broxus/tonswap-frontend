import * as React from 'react'
import classNames from 'classnames'

import { FarmingStatus as EFarmingStatus, getFarmingStatus } from '@/modules/Farming/utils'

import './index.scss'

type Props = {
    startTime: number;
    endTime?: number;
}

export function FarmingStatus({
    startTime,
    endTime,
}: Props): JSX.Element {
    const status = getFarmingStatus(startTime, endTime)

    return (
        <div
            className={classNames('farming-status', {
                'farming-status_active': status === EFarmingStatus.ACTIVE,
                'farming-status_ended': status === EFarmingStatus.ENDED,
                'farming-status_waiting': status === EFarmingStatus.WAITING,
            })}
        >
            {status === EFarmingStatus.ACTIVE && 'Active'}
            {status === EFarmingStatus.ENDED && 'Expired'}
            {status === EFarmingStatus.WAITING && 'Awaiting'}
        </div>
    )
}
