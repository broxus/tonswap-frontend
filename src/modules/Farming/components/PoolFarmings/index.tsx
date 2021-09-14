import * as React from 'react'
import { useIntl } from 'react-intl'

import { PanelLoader } from '@/components/common/PanelLoader'
import { ContentLoader } from '@/components/common/ContentLoader'
import { SectionTitle } from '@/components/common/SectionTitle'
import { Pagination } from '@/components/common/Pagination'

import { PoolFarmingsItem, PoolFarmingsItemProps } from './item'

import './index.scss'

export type PoolFarmingsProps = {
    items: PoolFarmingsItemProps[]
    loading?: boolean
    totalPages: number
    currentPage: number
    onNext: () => void
    onPrev: () => void
    onSubmit: (page: number) => void
}

export function PoolFarmings({
    items,
    loading,
    totalPages,
    currentPage,
    onNext,
    onPrev,
    onSubmit,
}: PoolFarmingsProps): JSX.Element {
    const intl = useIntl()

    return (
        <>
            <div className="pools-sub-header">
                <SectionTitle size="small">
                    {intl.formatMessage({ id: 'POOL_FARMINGS_TITLE' })}
                </SectionTitle>
            </div>

            <div className="card card--small card--flat">
                <div className="list pool-farming-list">
                    <div className="list__header">
                        <div className="list__cell list__cell--left">
                            {intl.formatMessage({ id: 'POOL_FARMINGS_FARMING_POOL' })}
                        </div>
                        <div className="list__cell list__cell--left">
                            {intl.formatMessage({ id: 'POOL_FARMINGS_REWARD' })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({ id: 'TVL' })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({ id: 'POOL_FARMINGS_TVL_CHANGE' })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({ id: 'POOL_FARMINGS_APR' })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({ id: 'POOL_FARMINGS_SHARE' })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({ id: 'POOL_FARMINGS_YOUR_REWARD' })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({ id: 'POOL_FARMINGS_ENTITLED_REWARD' })}
                        </div>
                    </div>

                    {loading && items.length === 0 ? (
                        <ContentLoader />
                    ) : (
                        <>
                            {!loading && items.length === 0 ? (
                                <div className="message message_faded">
                                    No farming pools found
                                </div>
                            ) : (
                                <PanelLoader loading={loading && items.length > 0}>
                                    {items.map((item, index) => (
                                        /* eslint-disable react/no-array-index-key */
                                        <PoolFarmingsItem key={index} {...item} />
                                    ))}
                                </PanelLoader>
                            )}
                        </>
                    )}
                </div>

                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        onNext={onNext}
                        onPrev={onPrev}
                        onSubmit={onSubmit}
                        totalPages={totalPages}
                    />
                )}
            </div>
        </>
    )
}
