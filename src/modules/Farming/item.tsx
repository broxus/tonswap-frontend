import * as React from 'react'
import BigNumber from 'bignumber.js'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { useParams } from 'react-router-dom'

import { SectionTitle } from '@/components/common/SectionTitle'
import { Icon } from '@/components/common/Icon'
import { ContentLoader } from '@/components/common/ContentLoader'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { FarmingHead } from '@/modules/Farming/components/FarmingHead'
import {
    FarmingMessageAdminLowBalance,
    FarmingMessageAdminZeroBalance,
    FarmingMessageFarmEnded,
    FarmingMessageGetLp,
    FarmingMessageLowBalance,
} from '@/modules/Farming/components/FarmingMessage'
import { FarmingDeposit } from '@/modules/Farming/FarmingDeposit'
import { FarmingWithdraw } from '@/modules/Farming/FarmingWithdraw'
import { FarmingAdminDeposit } from '@/modules/Farming/FarmingAdminDeposit'
import { FarmingAdminWithdraw } from '@/modules/Farming/components/FarmingAdminWithdraw'
import { FarmingUserInfo } from '@/modules/Farming/components/FarmingUserInfo'
import { FarmingBaseInfo } from '@/modules/Farming/components/FarmingBaseInfo'
import { FarmingConfig } from '@/modules/Farming/components/FarmingConfig'
import { FarmingVesting } from '@/modules/Farming/components/FarmingVesting'
import { FarmingAddresses } from '@/modules/Farming/components/FarmingAddresses'
import { FarmingSpeedTable } from '@/modules/Farming/components/FarmingSpeedTable'
import { FarmingTransactions } from '@/modules/Farming/components/FarmingTransactions'
import { FarmingCharts } from '@/modules/Farming/components/FarmingCharts'
import { useFarmingDataStore } from '@/modules/Farming/stores/FarmingDataStore'
import { useFarmingRoundConfigStore } from '@/modules/Farming/stores/FarmingRoundConfigStore'
import { useFarmingEndDateConfigStore } from '@/modules/Farming/stores/FarmingEndDateConfigStore'
import { useFarmingAdminWithdrawStore } from '@/modules/Farming/stores/FarmingAdminWithdrawStore'
import { useWallet } from '@/stores/WalletService'
import { appRoutes } from '@/routes'
import { concatSymbols } from '@/utils'

import './index.scss'

export function FarmingInner(): JSX.Element {
    const intl = useIntl()
    const params = useParams<{address: string}>()
    const [configVisible, setConfigVisible] = React.useState(false)
    const farmingData = useFarmingDataStore()
    const farmingRoundConfigStore = useFarmingRoundConfigStore()
    const farmingEndDateConfigStore = useFarmingEndDateConfigStore()
    const farmingAdminWithdrawStore = useFarmingAdminWithdrawStore()
    const wallet = useWallet()

    const showConfig = () => {
        setConfigVisible(true)
    }

    const hideConfig = () => {
        setConfigVisible(false)
    }

    React.useEffect(() => {
        if (!wallet.isConnecting && !wallet.isInitializing) {
            farmingData.getData(params.address)
        }

        return () => {
            farmingData.dispose()
            farmingRoundConfigStore.dispose()
            farmingEndDateConfigStore.dispose()
            farmingAdminWithdrawStore.dispose()
        }
    }, [
        wallet.isConnecting,
        wallet.isInitializing,
    ])

    React.useEffect(() => {
        if (!configVisible) {
            farmingRoundConfigStore.dispose()
            farmingEndDateConfigStore.dispose()
        }
    }, [configVisible])

    return (
        <div className="container container--large">
            <section className="section">
                {!farmingData.dataIsExists && farmingData.loading ? (
                    <ContentLoader />
                ) : (
                    <>
                        {!farmingData.dataIsExists ? (
                            <div className="card card--small card--flat">
                                <div className="message message_faded">
                                    <p>{intl.formatMessage({ id: 'FARMING_ITEM_NOT_FOUND' })}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Breadcrumb
                                    items={[{
                                        link: appRoutes.farming.makeUrl(),
                                        title: intl.formatMessage({
                                            id: 'FARMING_ITEM_BREADCRUMB_LIST',
                                        }),
                                    }, {
                                        title: intl.formatMessage({
                                            id: 'FARMING_ITEM_BREADCRUMB_ITEM',
                                        }, {
                                            symbol: farmingData.leftTokenSymbol || farmingData.rightTokenSymbol
                                                ? concatSymbols(
                                                    farmingData.leftTokenSymbol,
                                                    farmingData.rightTokenSymbol,
                                                )
                                                : farmingData.lpTokenSymbol,
                                        }),
                                    }]}
                                />

                                {
                                    farmingData.lpTokenAddress
                                    && farmingData.lpTokenSymbol
                                    && farmingData.startTime
                                    && farmingData.rewardTokensAddress
                                    && farmingData.poolAddress
                                    && (
                                        <FarmingHead
                                            apr={farmingData.apr}
                                            leftTokenRoot={farmingData.leftTokenAddress}
                                            rightTokenRoot={farmingData.rightTokenAddress}
                                            rootTokenAddress={farmingData.lpTokenAddress}
                                            rootTokenSymbol={farmingData.lpTokenSymbol}
                                            startTime={farmingData.startTime}
                                            endTime={farmingData.endTime}
                                            rewardTokenRoots={farmingData.rewardTokensAddress}
                                            poolAddress={farmingData.poolAddress}
                                        />
                                    )
                                }

                                {
                                    !farmingData.isAdmin
                                    && farmingData.isActive
                                    && farmingData.leftTokenAddress
                                    && farmingData.rightTokenAddress
                                    && farmingData.userLpWalletAmount
                                    && farmingData.userLpFarmingAmount
                                    && new BigNumber(farmingData.userLpWalletAmount).isZero()
                                    && new BigNumber(farmingData.userLpFarmingAmount).isZero()
                                    && farmingData.apr
                                    && farmingData.lpTokenSymbol
                                    && (
                                        <FarmingMessageGetLp
                                            apr={farmingData.apr}
                                            rootTokenSymbol={farmingData.lpTokenSymbol}
                                            leftTokenRoot={farmingData.leftTokenAddress}
                                            rightTokenRoot={farmingData.rightTokenAddress}
                                        />
                                    )
                                }

                                {
                                    farmingData.isAdmin === false
                                    && farmingData.isActive === false
                                    && (
                                        <FarmingMessageFarmEnded />
                                    )
                                }

                                {
                                    farmingData.isAdmin === false
                                    && farmingData.rewardBalanceIsLow === true
                                    && (
                                        <FarmingMessageLowBalance />
                                    )
                                }

                                {
                                    farmingData.isAdmin === true
                                    && farmingData.rewardBalanceIsLow === true
                                    && (
                                        <FarmingMessageAdminLowBalance />
                                    )
                                }

                                {
                                    farmingData.isAdmin === true
                                    && farmingData.rewardBalanceIsZero === true
                                    && (
                                        <FarmingMessageAdminZeroBalance />
                                    )
                                }

                                {farmingData.userInFarming && (
                                    <>
                                        <div className="farming-title">
                                            <SectionTitle size="small">
                                                {intl.formatMessage({
                                                    id: 'FARMING_ITEM_USER_INFO_TITLE',
                                                })}
                                            </SectionTitle>
                                        </div>

                                        <FarmingUserInfo
                                            userUsdtBalance={farmingData.userUsdtBalance}
                                            userLpFarmingAmount={farmingData.userLpFarmingAmount}
                                            leftTokenAddress={farmingData.leftTokenAddress}
                                            rightTokenAddress={farmingData.rightTokenAddress}
                                            lpTokenSymbol={farmingData.lpTokenSymbol}
                                            lpTokenDecimals={farmingData.lpTokenDecimals}
                                            pairBalanceLeft={farmingData.pairBalanceLeft}
                                            pairBalanceRight={farmingData.pairBalanceRight}
                                            pairBalanceLp={farmingData.pairBalanceLp}
                                            rewardTokensAddress={farmingData.rewardTokensAddress}
                                            unclaimedAmounts={farmingData.userPendingRewardVested}
                                            entitledAmounts={farmingData.userPendingRewardEntitled}
                                            debtAmounts={farmingData.userPendingRewardDebt}
                                            userShare={farmingData.userShare}
                                            userHistoryUsdtBalance={farmingData.userHistoryUsdtBalance}
                                            userHistoryLeftAmount={farmingData.userHistoryLeftAmount}
                                            userHistoryRightAmount={farmingData.userHistoryRightAmount}
                                            vestingTime={farmingData.vestingTime}
                                            rewardTotalBalance={farmingData.rewardTotalBalance}
                                            userHistoryLastUpdateTime={farmingData.userHistoryLastUpdateTime}
                                        />
                                    </>
                                )}

                                {farmingData.isAdmin === true && (
                                    <>
                                        <div className="farming-title" id="pool-management">
                                            <SectionTitle size="small">
                                                {intl.formatMessage({
                                                    id: 'FARMING_ITEM_MANAGEMENT_TITLE',
                                                })}
                                            </SectionTitle>

                                            <button
                                                type="button"
                                                className="btn btn-md btn-square btn-icon"
                                                onClick={showConfig}
                                            >
                                                <Icon icon="config" />
                                            </button>

                                            {configVisible && farmingData.rewardTokensAddress && (
                                                <FarmingConfig
                                                    onClose={hideConfig}
                                                    endDateFrom={{
                                                        onSubmit: farmingEndDateConfigStore.submit,
                                                        onChangeEndDate: farmingEndDateConfigStore.setEndDate,
                                                        onChangeEndTime: farmingEndDateConfigStore.setEndTime,
                                                        actualEndTime: farmingData.endTime,
                                                        endDate: farmingEndDateConfigStore.endDate,
                                                        endTime: farmingEndDateConfigStore.endTime,
                                                        loading: farmingEndDateConfigStore.loading,
                                                        disabled: !farmingEndDateConfigStore.endDateIsValid,
                                                    }}
                                                    rewardFrom={{
                                                        onSubmit: farmingRoundConfigStore.submit,
                                                        onChangeAmount: farmingRoundConfigStore.setAmount,
                                                        onChangeStartDate: farmingRoundConfigStore.setStartDate,
                                                        onChangeStartTime: farmingRoundConfigStore.setStartTime,
                                                        rewardTokensRoots: farmingData.rewardTokensAddress,
                                                        rewardTokensAmounts: farmingRoundConfigStore.amounts,
                                                        startDate: farmingRoundConfigStore.startDate,
                                                        startTime: farmingRoundConfigStore.startTime,
                                                        blocked: farmingRoundConfigStore.loading
                                                            || farmingRoundConfigStore.blocked,
                                                        disabled: !farmingRoundConfigStore.rewardIsValid,
                                                    }}
                                                />
                                            )}
                                        </div>

                                        <div className="farming-management">
                                            <FarmingAdminDeposit />

                                            {
                                                farmingData.rewardTokensAddress
                                                && farmingData.rewardTokensBalance
                                                && (
                                                    <FarmingAdminWithdraw
                                                        tokensRoots={farmingData.rewardTokensAddress}
                                                        tokensAmounts={farmingData.rewardTokensBalance}
                                                        disabled={farmingAdminWithdrawStore.loading
                                                        || !farmingAdminWithdrawStore.isEnabled}
                                                        onSubmit={farmingAdminWithdrawStore.submit}
                                                    />
                                                )
                                            }
                                        </div>
                                    </>
                                )}


                                {wallet.isConnected && (
                                    <>
                                        <div className="farming-title">
                                            <SectionTitle size="small">
                                                {intl.formatMessage({
                                                    id: 'FARMING_ITEM_BALANCE_TITLE',
                                                })}
                                            </SectionTitle>
                                        </div>
                                        <div className="farming-balance">
                                            <FarmingDeposit />
                                            <FarmingWithdraw />
                                        </div>
                                    </>
                                )}

                                <div className="farming-title">
                                    <SectionTitle size="small">
                                        {intl.formatMessage({
                                            id: 'FARMING_ITEM_BASE_INFO_TITLE',
                                        })}
                                    </SectionTitle>
                                </div>

                                <div className="farming-stats">
                                    <FarmingBaseInfo
                                        tvl={farmingData.tvl}
                                        apr={farmingData.apr}
                                        rewardTokensRoot={farmingData.rewardTokensAddress}
                                        rewardTokensAmount={farmingData.rewardTokensBalance}
                                        rpsAmount={farmingData.rpsAmount}
                                        lpTokenSymbol={farmingData.lpTokenSymbol}
                                        lpTokenBalance={farmingData.lpTokenBalance}
                                        leftTokenRoot={farmingData.leftTokenAddress}
                                        rightTokenRoot={farmingData.rightTokenAddress}
                                        leftTokenBalance={farmingData.leftTokenBalance}
                                        rightTokenBalance={farmingData.rightTokenBalance}
                                    />

                                    {farmingData.poolAddress && (
                                        <FarmingCharts
                                            poolAddress={farmingData.poolAddress}
                                        />
                                    )}
                                </div>

                                {
                                    farmingData.rewardTokensAddress
                                    && farmingData.roundStartTimes
                                    && farmingData.roundRps
                                    && (
                                        <>
                                            <div className="farming-title">
                                                <SectionTitle size="small">
                                                    {intl.formatMessage({
                                                        id: 'FARMING_ITEM_SPEED_TITLE',
                                                    })}
                                                </SectionTitle>

                                                {farmingData.isAdmin === true && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-md btn-square btn-icon"
                                                        onClick={showConfig}
                                                    >
                                                        <Icon icon="config" />
                                                    </button>
                                                )}
                                            </div>

                                            <FarmingSpeedTable
                                                rewardTokensRoots={farmingData.rewardTokensAddress}
                                                roundStartTimes={farmingData.roundStartTimes}
                                                roundRps={farmingData.roundRps}
                                                endTime={farmingData.endTime}
                                            />
                                        </>
                                    )
                                }

                                <div className="farming-title">
                                    <SectionTitle size="small">
                                        {intl.formatMessage({
                                            id: 'FARMING_ITEM_DETAILS_TITLE',
                                        })}
                                    </SectionTitle>
                                </div>

                                <div className="farming-details">
                                    <FarmingVesting
                                        vestingRatio={farmingData.vestingRatio}
                                        vestingPeriodDays={farmingData.vestingPeriodDays}
                                        vestingTime={farmingData.vestingTime}
                                    />

                                    <FarmingAddresses
                                        poolAddress={farmingData.poolAddress}
                                        ownerAddress={farmingData.poolOwnerAddress}
                                        userAddress={farmingData.userPoolDataAddress}
                                        tokenRoot={farmingData.lpTokenAddress}
                                        rewardTokensRoots={farmingData.rewardTokensAddress}
                                    />
                                </div>


                                {
                                    farmingData.poolAddress
                                    && farmingData.isExternalLpToken !== undefined
                                    && farmingData.lpTokenSymbol !== undefined
                                    && (
                                        <>
                                            <div className="farming-title">
                                                <SectionTitle size="small">
                                                    {intl.formatMessage({
                                                        id: 'FARMING_ITEM_TRANSACTIONS_TITLE',
                                                    })}
                                                </SectionTitle>
                                            </div>

                                            <FarmingTransactions
                                                poolAddress={farmingData.poolAddress}
                                                userAddress={wallet.address}
                                                isExternalLpToken={farmingData.isExternalLpToken}
                                                lpTokenSymbol={farmingData.lpTokenSymbol}
                                                leftTokenSymbol={farmingData.leftTokenSymbol}
                                                rightTokenSymbol={farmingData.rightTokenSymbol}
                                            />
                                        </>
                                    )
                                }
                            </>
                        )}
                    </>
                )}
            </section>
        </div>
    )
}

export const Farming = observer(FarmingInner)
