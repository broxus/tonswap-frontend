import * as React from 'react'
import classNames from 'classnames'
import { useIntl } from 'react-intl'

import { Pair, PairProps } from '@/components/common/Pair'
import { Tooltip } from '@/components/common/Tooltip'
import { Icon } from '@/components/common/Icon'
import { FarmingStatus, getFarmingStatus } from '@/modules/Farming/utils'

import './index.scss'

type Props = {
    pairIcons: PairProps['pairIcons']
    pairLabel: PairProps['pairLabel']
    startTime: number
    endTime?: number
    isOwner?: boolean
    isPublic?: boolean
    balanceWarning?: boolean
}

export function FarmingPair({
    pairIcons,
    pairLabel,
    startTime,
    endTime,
    isOwner,
    isPublic,
    balanceWarning,
}: Props): JSX.Element {
    const intl = useIntl()
    const userRef = React.useRef<HTMLDivElement>(null)
    const waitingRef = React.useRef<HTMLElement>(null)
    const warningRef = React.useRef<HTMLDivElement>(null)
    const status = getFarmingStatus(startTime, endTime)

    return (
        <div className="farming-pair">
            <span
                ref={waitingRef}
                className={classNames('farming-pair__status', {
                    'farming-pair__status_ended': status === FarmingStatus.ENDED,
                    'farming-pair__status_waiting': status === FarmingStatus.WAITING,
                    'farming-pair__status_active': status === FarmingStatus.ACTIVE,
                })}
            />
            {status === FarmingStatus.WAITING && (
                <Tooltip target={waitingRef}>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: intl.formatMessage({
                                id: 'FARMING_PAIR_WAITING_TOOLTIP',
                            }),
                        }}
                    />
                </Tooltip>
            )}

            <Pair pairIcons={pairIcons} pairLabel={pairLabel} />

            {isOwner && isPublic !== undefined && (
                <>
                    <div
                        ref={userRef}
                        className={classNames('farming-pair__user', {
                            'farming-pair__user_private': !isPublic,
                        })}
                    >
                        <Icon icon="user" />
                    </div>
                    <Tooltip target={userRef}>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: intl.formatMessage({
                                    id: isPublic
                                        ? 'FARMING_PAIR_PUBLIC_TOOLTIP'
                                        : 'FARMING_PAIR_PRIVATE_TOOLTIP',
                                }),
                            }}
                        />
                    </Tooltip>
                </>
            )}

            {balanceWarning && (
                <>
                    <div ref={warningRef}>
                        <Icon icon="warning" />
                    </div>
                    <Tooltip target={warningRef}>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: intl.formatMessage({
                                    id: 'FARMING_PAIR_WARNING_TOOLTIP',
                                }),
                            }}
                        />
                    </Tooltip>
                </>
            )}
        </div>
    )
}
