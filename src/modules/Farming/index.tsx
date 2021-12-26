import * as React from 'react'
import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { SectionTitle } from '@/components/common/SectionTitle'
import { ContentLoader } from '@/components/common/ContentLoader'
import { FarmingList } from '@/modules/Farming/components/FarmingList'
import {
    useFarmingListStore,
    useFavoriteFarmingListStore,
} from '@/modules/Farming/stores/FarmingListStore'
import { appRoutes } from '@/routes'
import { useFavoriteFarmings } from '@/stores/FavoritePairs'
import { useWallet } from '@/stores/WalletService'

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

    if (wallet.isConnecting || wallet.isInitializing) {
        return <ContentLoader />
    }

    return (
        <div className="container container--large">
            <section className="section">
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
                        rewardsLoading={favoriteFarmingListStore.rewards.map(item => item.loading)}
                        queryParamPrefix="fav"
                    />
                )}

                <div>
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
                        rewardsLoading={farmingListStore.rewards.map(item => item.loading)}
                    />
                </div>
            </section>
        </div>
    )
}

export const Farmings = observer(FarmingsInner)
