import { DateTime } from 'luxon'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Icon } from '@/components/common/Icon'
import { Warning } from '@/components/common/Warning'
import { TextInput } from '@/components/common/TextInput'
import { useTokensCache } from '@/stores/TokensCacheService'

import './index.scss'

type Props = {
    onClose: () => void;
    endDateFrom: {
        onSubmit: () => void;
        onChangeEndDate: (value: string) => void;
        onChangeEndTime: (value: string) => void;
        actualEndTime: number;
        endDate: string;
        endTime: string;
        loading: boolean;
        disabled: boolean;
    },
    rewardFrom: {
        onChangeAmount: (index: number, value: string) => void;
        onChangeStartDate: (value: string) => void;
        onChangeStartTime: (value: string) => void;
        onSubmit: () => void;
        startDate: string;
        startTime: string;
        rewardTokensRoots: string[];
        rewardTokensAmounts: string[];
        blocked: boolean;
        disabled: boolean;
    },
}

enum Tab {
    Speed = 1,
    EndTime = 2
}

function FarmingConfigInner({
    onClose,
    rewardFrom,
    endDateFrom,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const [currentTab, setCurrentTab] = React.useState(Tab.Speed)
    const [confirmationVisible, setConfirmationVisible] = React.useState(false)
    const rewardTokens = rewardFrom.rewardTokensRoots.map(root => tokensCache.get(root))
    const actualEndDateTime = DateTime.fromMillis(endDateFrom.actualEndTime)

    const submitReward = async () => {
        await rewardFrom.onSubmit()
        onClose()
    }

    const submitEndDate = async () => {
        await endDateFrom.onSubmit()
        onClose()
    }

    const showConfirmation = () => {
        setConfirmationVisible(true)
    }

    const hideConfirmation = () => {
        setConfirmationVisible(false)
    }

    return ReactDOM.createPortal(
        <div className="popup">
            <div onClick={onClose} className="popup-overlay" />
            <div className="popup__wrap farming-config">
                <h2 className="farming-config__title">
                    {intl.formatMessage({
                        id: confirmationVisible
                            ? 'FARMING_CONFIG_CONFIRMATION_TITLE'
                            : 'FARMING_CONFIG_TITLE',
                    })}

                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-icon popup-close"
                    >
                        <Icon icon="close" />
                    </button>
                </h2>

                {confirmationVisible ? (
                    <>
                        <div className="farming-config__warning">
                            {intl.formatMessage({
                                id: 'FARMING_CONFIG_CONFIRMATION_TEXT',
                            })}
                        </div>

                        <div className="farming-config__action">
                            <button
                                type="button"
                                className="btn btn-s btn-tertiary"
                                onClick={hideConfirmation}
                                disabled={endDateFrom.loading}
                            >
                                {intl.formatMessage({
                                    id: 'FARMING_CONFIG_CONFIRMATION_NO',
                                })}
                            </button>
                            <button
                                type="button"
                                className="btn btn-s btn-danger"
                                onClick={submitEndDate}
                                disabled={endDateFrom.disabled || endDateFrom.loading}
                            >
                                {intl.formatMessage({
                                    id: 'FARMING_CONFIG_CONFIRMATION_YES',
                                })}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <ul className="farming-config__tabs">
                            <li
                                className={currentTab === Tab.Speed ? 'active' : undefined}
                                onClick={() => setCurrentTab(Tab.Speed)}
                            >
                                {intl.formatMessage({
                                    id: 'FARMING_CONFIG_TAB_SPEED',
                                })}
                            </li>
                            <li
                                className={currentTab === Tab.EndTime ? 'active' : undefined}
                                onClick={() => setCurrentTab(Tab.EndTime)}
                            >
                                {intl.formatMessage({
                                    id: 'FARMING_CONFIG_TAB_END_TIME',
                                })}
                            </li>
                        </ul>

                        {currentTab === Tab.Speed && (
                            <>
                                {rewardTokens.map((token, index) => (
                                    token && (
                                        <div className="farming-config__filed" key={token.root}>
                                            <div className="farming-config__label">
                                                {intl.formatMessage({
                                                    id: 'FARMING_CONFIG_REWARD_AMOUNT_LABEL',
                                                }, {
                                                    symbol: token.symbol,
                                                })}
                                            </div>
                                            <TextInput
                                                placeholder={intl.formatMessage({
                                                    id: 'FARMING_CONFIG_REWARD_AMOUNT_PLACEHOLDER',
                                                })}
                                                value={rewardFrom.rewardTokensAmounts[index] || ''}
                                                onChange={value => rewardFrom.onChangeAmount(index, value)}
                                                disabled={rewardFrom.blocked}
                                            />
                                        </div>
                                    )
                                ))}

                                <div className="farming-config__filed">
                                    <div className="farming-config__label">
                                        {intl.formatMessage({
                                            id: 'FARMING_CONFIG_START_LABEL',
                                        })}
                                    </div>
                                    <div className="farming-config__cols">
                                        <TextInput
                                            placeholder={intl.formatMessage({
                                                id: 'FARMING_CONFIG_DATE_PLACEHOLDER',
                                            })}
                                            value={rewardFrom.startDate}
                                            onChange={rewardFrom.onChangeStartDate}
                                            disabled={rewardFrom.blocked}
                                        />
                                        <TextInput
                                            placeholder={intl.formatMessage({
                                                id: 'FARMING_CONFIG_TIME_PLACEHOLDER',
                                            })}
                                            value={rewardFrom.startTime}
                                            onChange={rewardFrom.onChangeStartTime}
                                            disabled={rewardFrom.blocked}
                                        />
                                    </div>
                                </div>

                                <div className="farming-config__action">
                                    <button
                                        type="button"
                                        className="btn btn-s btn-primary"
                                        disabled={rewardFrom.blocked || rewardFrom.disabled || rewardFrom.blocked}
                                        onClick={submitReward}
                                    >
                                        {intl.formatMessage({
                                            id: 'FARMING_CONFIG_SAVE_CHANGES',
                                        })}
                                    </button>
                                </div>
                            </>
                        )}

                        {currentTab === Tab.EndTime && (
                            <>
                                {endDateFrom.actualEndTime === 0 && (
                                    <div className="farming-config__warning">
                                        <Warning
                                            theme="warning"
                                            title={intl.formatMessage({
                                                id: 'FARMING_CONFIG_CONFIRMATION_TEXT',
                                            })}
                                        />
                                    </div>
                                )}

                                <div className="farming-config__filed">
                                    <div className="farming-config__label">
                                        {intl.formatMessage({
                                            id: 'FARMING_CONFIG_END_LABEL',
                                        })}
                                    </div>
                                    <div className="farming-config__cols">
                                        <TextInput
                                            placeholder={intl.formatMessage({
                                                id: 'FARMING_CONFIG_DATE_PLACEHOLDER',
                                            })}
                                            value={endDateFrom.actualEndTime > 0
                                                ? actualEndDateTime.toFormat('yyyy.MM.dd')
                                                : endDateFrom.endDate}
                                            onChange={endDateFrom.onChangeEndDate}
                                            disabled={endDateFrom.loading || endDateFrom.actualEndTime > 0}
                                        />
                                        <TextInput
                                            placeholder={intl.formatMessage({
                                                id: 'FARMING_CONFIG_TIME_PLACEHOLDER',
                                            })}
                                            value={endDateFrom.actualEndTime > 0
                                                ? actualEndDateTime.toFormat('hh:mm')
                                                : endDateFrom.endTime}
                                            onChange={endDateFrom.onChangeEndTime}
                                            disabled={endDateFrom.loading || endDateFrom.actualEndTime > 0}
                                        />
                                    </div>
                                </div>

                                <div className="farming-config__action">
                                    <button
                                        type="button"
                                        className="btn btn-s btn-danger"
                                        onClick={showConfirmation}
                                        disabled={
                                            endDateFrom.loading
                                            || endDateFrom.disabled
                                            || endDateFrom.actualEndTime > 0
                                        }
                                    >
                                        {intl.formatMessage({
                                            id: 'FARMING_CONFIG_CLOSE_POOL',
                                        })}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>,
        document.body,
    )
}

export const FarmingConfig = observer(FarmingConfigInner)
