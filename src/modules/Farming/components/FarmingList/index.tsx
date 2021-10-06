import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { SectionTitle } from '@/components/common/SectionTitle'
import { FarmingTable } from '@/modules/Farming/components/FarmingTable'
import { FarmingFilters } from '@/modules/Farming/components/FarmingFilters'
import {
    FarmingListStore, useFarmingListStore, useFavoriteFarmingListStore,
} from '@/modules/Farming/stores/FarmingListStore'
import { useTokensCache } from '@/stores/TokensCacheService'
import { useFavoriteFarmings } from '@/stores/FavoritePairs'
import { appRoutes } from '@/routes'
import { debounce } from '@/utils'

export function FarmingListInner(): JSX.Element {
    const intl = useIntl()
    const favoriteFarmings = useFavoriteFarmings()
    const farmingListStore = useFarmingListStore()
    const favoriteFarmingListStore = useFavoriteFarmingListStore()
    const tokensCache = useTokensCache()

    const mapStoreToProps = (store: FarmingListStore) => ({
        totalPages: store.totalPages,
        currentPage: store.currentPage,
        onNext: store.nextPage,
        onPrev: store.prevPage,
        onSubmit: store.submitPage,
        loading: store.loading,
        items: store.data.map(item => ({
            leftToken: item.info.left_address && item.info.right_address ? {
                address: item.info.left_address,
                uri: tokensCache.get(item.info.left_address)?.icon,
                name: item.info.left_currency,
            } : {
                address: item.info.token_root_address,
                uri: tokensCache.get(item.info.token_root_address)?.icon,
                name: item.info.token_root_currency,
            },
            rightToken: item.info.right_address ? {
                address: item.info.right_address,
                uri: tokensCache.get(item.info.right_address)?.icon,
                name: item.info.right_currency,
            } : undefined,
            rewardsIcons: item.info.reward_token_root_info.map(rewardInfo => ({
                address: rewardInfo.reward_root_address,
                name: rewardInfo.reward_currency,
                uri: tokensCache.get(rewardInfo.reward_root_address)?.icon,
            })),
            apr: item.info.apr,
            rewards: item.reward.map(({ amount, symbol }) => (
                intl.formatMessage({
                    id: 'POOLS_LIST_TOKEN_BALANCE',
                }, {
                    symbol,
                    value: amount,
                })
            )),
            share: item.info.share,
            tvl: item.info.tvl,
            tvlChange: item.info.tvl_change,
            startTime: item.info.farm_start_time,
            endTime: item.info.farm_end_time,
            link: appRoutes.farmingItem.makeUrl({
                address: item.info.pool_address,
            }),
            balanceWarning: item.info.is_low_balance,
        })),
    })

    React.useEffect(() => {
        farmingListStore.getData()
        favoriteFarmingListStore.getData()

        return () => {
            farmingListStore.dispose()
            favoriteFarmingListStore.dispose()
        }
    }, [])

    return (
        <>
            {favoriteFarmings.addresses.length > 0 && (
                <>
                    <div className="farming-list-header">
                        <SectionTitle size="small">
                            {intl.formatMessage({
                                id: 'FARMING_LIST_TITLE_FAV',
                            })}
                        </SectionTitle>
                        <FarmingFilters
                            lowBalanceEnabled={false}
                            onQuery={debounce(favoriteFarmingListStore.changeQuery, 300)}
                            onSubmit={favoriteFarmingListStore.changeFilter}
                        />
                    </div>

                    <FarmingTable {...mapStoreToProps(favoriteFarmingListStore)} />
                </>
            )}

            <div className="farming-list-header">
                <SectionTitle size="small">
                    {intl.formatMessage({
                        id: 'FARMING_LIST_TITLE_ALL',
                    })}
                </SectionTitle>
                <FarmingFilters
                    lowBalanceEnabled
                    onQuery={debounce(farmingListStore.changeQuery, 300)}
                    onSubmit={farmingListStore.changeFilter}
                />
            </div>

            <FarmingTable {...mapStoreToProps(farmingListStore)} />
        </>
    )
}

export const FarmingList = observer(FarmingListInner)
