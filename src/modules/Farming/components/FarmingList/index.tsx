import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { SectionTitle } from '@/components/common/SectionTitle'
import { FarmingTable } from '@/modules/Farming/components/FarmingTable'
import { FarmingFilters } from '@/modules/Farming/components/FarmingFilters'
import { FarmingPoolFilter, FarmingPoolsItemResponse } from '@/modules/Farming/types'
import { useTokensCache } from '@/stores/TokensCacheService'
import { debounce, formattedAmount } from '@/utils'
import { appRoutes } from '@/routes'

type Props = {
    title: string;
    lowBalanceEnabled: boolean;
    onChangeQuery: (value: string) => void;
    onChangeFilter: (filter: FarmingPoolFilter) => void;
    loading: boolean;
    data: FarmingPoolsItemResponse[];
    vestedRewards: (string[] | undefined)[];
    entitledRewards: (string[] | undefined)[];
    totalPages: number;
    currentPage: number;
    onNextPage: () => void;
    onPrevPage: () => void;
    onSubmitPage: (page: number) => void;
    queryParamPrefix?: string;
    rewardsLoading: (boolean | undefined)[];
}

export function FarmingListInner({
    title,
    lowBalanceEnabled,
    onChangeQuery,
    onChangeFilter,
    loading,
    data,
    vestedRewards,
    entitledRewards,
    totalPages,
    currentPage,
    onNextPage,
    onPrevPage,
    onSubmitPage,
    queryParamPrefix,
    rewardsLoading,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const items = React.useMemo(() => (
        data.map((item, index) => {
            const itemVestedRewards = vestedRewards[index]
            const itemEntitledRewards = entitledRewards[index]

            return {
                leftToken: item.left_address && item.right_address ? {
                    address: item.left_address,
                    uri: tokensCache.get(item.left_address)?.icon,
                    name: item.left_currency,
                } : {
                    address: item.token_root_address,
                    uri: tokensCache.get(item.token_root_address)?.icon,
                    name: item.token_root_currency,
                },
                rightToken: item.right_address ? {
                    address: item.right_address,
                    uri: tokensCache.get(item.right_address)?.icon,
                    name: item.right_currency,
                } : undefined,
                rewardsIcons: item.reward_token_root_info.map(rewardInfo => ({
                    address: rewardInfo.reward_root_address,
                    name: rewardInfo.reward_currency,
                    uri: tokensCache.get(rewardInfo.reward_root_address)?.icon,
                })),
                apr: item.left_address && item.right_address
                    ? item.apr
                    : null,
                aprChange: item.left_address && item.right_address
                    ? item.apr_change
                    : null,
                vestedRewards: item.reward_token_root_info.map((rewardInfo, idx) => intl.formatMessage({
                    id: 'POOLS_LIST_TOKEN_BALANCE',
                }, {
                    symbol: rewardInfo.reward_currency,
                    value: itemVestedRewards
                        ? formattedAmount(itemVestedRewards[idx], rewardInfo.reward_scale)
                        : '0',
                })),
                entitledRewards: item.reward_token_root_info.map((rewardInfo, idx) => intl.formatMessage({
                    id: 'POOLS_LIST_TOKEN_BALANCE',
                }, {
                    symbol: rewardInfo.reward_currency,
                    value: itemEntitledRewards
                        ? formattedAmount(itemEntitledRewards[idx], rewardInfo.reward_scale)
                        : '0',
                })),
                share: item.share,
                tvl: item.left_address && item.right_address
                    ? item.tvl
                    : null,
                tvlChange: item.left_address && item.right_address
                    ? item.tvl_change
                    : null,
                startTime: item.farm_start_time,
                endTime: item.farm_end_time,
                link: appRoutes.farmingItem.makeUrl({
                    address: item.pool_address,
                }),
                balanceWarning: item.is_low_balance,
                rewardsLoading: rewardsLoading ? rewardsLoading[index] : undefined,
            }
        })
    ), [
        data,
        vestedRewards,
        entitledRewards,
        intl,
        tokensCache,
        rewardsLoading,
    ])

    return (
        <>
            <div className="farming-list-header">
                <SectionTitle size="small">{title}</SectionTitle>
                <FarmingFilters
                    queryParamPrefix={queryParamPrefix}
                    lowBalanceEnabled={lowBalanceEnabled}
                    onQuery={debounce(onChangeQuery, 300)}
                    onSubmit={onChangeFilter}
                />
            </div>

            <FarmingTable
                loading={loading}
                items={items}
                totalPages={totalPages}
                currentPage={currentPage}
                onNext={onNextPage}
                onPrev={onPrevPage}
                onSubmit={onSubmitPage}
            />
        </>
    )
}

export const FarmingList = observer(FarmingListInner)
