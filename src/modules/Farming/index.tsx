import * as React from 'react'
import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { SectionTitle } from '@/components/common/SectionTitle'
import { ContentLoader } from '@/components/common/ContentLoader'
import { FarmingList } from '@/modules/Farming/components/FarmingList'
import {
    useFarmingListStore, useFavoriteFarmingListStore,
} from '@/modules/Farming/stores/FarmingListStore'
import { useFavoriteFarmings } from '@/stores/FavoritePairs'
import { useWallet } from '@/stores/WalletService'
import { appRoutes } from '@/routes'

import './index.scss'

function FarmingsInner(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()
    const favoriteFarmings = useFavoriteFarmings()
    const farmingListStore = useFarmingListStore()
    const favoriteFarmingListStore = useFavoriteFarmingListStore()

    React.useEffect(() => () => {
        farmingListStore.dispose()
        favoriteFarmingListStore.dispose()
    }, [])

    return wallet.isConnecting || wallet.isInitializing ? (
        <ContentLoader />
    ) : (
        <div className="section section--large">
            <div className="section__header">
                <SectionTitle>
                    {intl.formatMessage({
                        id: 'FARMING_LIST_TITLE',
                    })}
                </SectionTitle>
                <Link
                    className="btn btn-primary"
                    to={appRoutes.farmingCreate.path}
                >
                    {intl.formatMessage({
                        id: 'FARMING_LIST_CREATE_BTN',
                    })}
                </Link>
            </div>

            {favoriteFarmings.addresses.length > 0 && (
                <FarmingList
                    key="favorite"
                    lowBalanceEnabled={false}
                    title={intl.formatMessage({
                        id: 'FARMING_LIST_TITLE_FAV',
                    })}
                    currentPage={favoriteFarmingListStore.currentPage}
                    loading={favoriteFarmingListStore.loading}
                    onChangeFilter={favoriteFarmingListStore.changeFilter}
                    onChangeQuery={favoriteFarmingListStore.changeQuery}
                    onNextPage={favoriteFarmingListStore.nextPage}
                    onPrevPage={favoriteFarmingListStore.prevPage}
                    onSubmitPage={favoriteFarmingListStore.submitPage}
                    totalPages={favoriteFarmingListStore.totalPages}
                    data={favoriteFarmingListStore.data}
                    vestedRewards={favoriteFarmingListStore.rewards.map(item => item.vested)}
                    entitledRewards={favoriteFarmingListStore.rewards.map(item => item.entitled)}
                    queryParamPrefix="fav"
                />
            )}

            <FarmingList
                key="all"
                lowBalanceEnabled
                title={intl.formatMessage({
                    id: 'FARMING_LIST_TITLE_ALL',
                })}
                currentPage={farmingListStore.currentPage}
                loading={farmingListStore.loading}
                onChangeFilter={farmingListStore.changeFilter}
                onChangeQuery={farmingListStore.changeQuery}
                onNextPage={farmingListStore.nextPage}
                onPrevPage={farmingListStore.prevPage}
                onSubmitPage={farmingListStore.submitPage}
                totalPages={farmingListStore.totalPages}
                data={farmingListStore.data}
                vestedRewards={farmingListStore.rewards.map(item => item.vested)}
                entitledRewards={farmingListStore.rewards.map(item => item.entitled)}
            />
        </div>
    )
}

export const Farmings = observer(FarmingsInner)
