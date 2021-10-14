import * as React from 'react'
import { useIntl } from 'react-intl'

import { ContentLoader } from '@/components/common/ContentLoader'
import { PanelLoader } from '@/components/common/PanelLoader'
import { Pagination } from '@/components/common/Pagination'
import { FarmingTableItem, FarmingTableItemProps } from '@/modules/Farming/components/FarmingTable/item'

import './index.scss'

export type FarmingTableProps = {
    items: FarmingTableItemProps[];
    loading?: boolean;
    totalPages: number;
    currentPage?: number;
    onNext?: () => void;
    onPrev?: () => void;
    onSubmit?: (page: number) => void;
}

export function FarmingTable({
    loading,
    items,
    totalPages,
    currentPage,
    onNext,
    onPrev,
    onSubmit,
}: FarmingTableProps): JSX.Element {
    const intl = useIntl()

    return (
        <div className="card card--small card--flat">
            <div className="list farming-table">
                <div className="list__header">
                    <div className="list__cell list__cell--left">
                        {intl.formatMessage({ id: 'FARMING_TABLE_FARMING_POOL' })}
                    </div>
                    <div className="list__cell list__cell--left">
                        {intl.formatMessage({ id: 'FARMING_TABLE_REWARD' })}
                    </div>
                    <div className="list__cell list__cell--right">
                        {intl.formatMessage({ id: 'FARMING_TABLE_TVL' })}
                    </div>
                    <div className="list__cell list__cell--right">
                        {intl.formatMessage({ id: 'FARMING_TABLE_TVL_CHANGE' })}
                    </div>
                    <div className="list__cell list__cell--right">
                        {intl.formatMessage({ id: 'FARMING_TABLE_APR' })}
                    </div>
                    <div className="list__cell list__cell--right">
                        {intl.formatMessage({ id: 'FARMING_TABLE_APR_CHANGE' })}
                    </div>
                    <div className="list__cell list__cell--right">
                        {intl.formatMessage({ id: 'FARMING_TABLE_SHARE' })}
                    </div>
                    <div className="list__cell list__cell--right">
                        {intl.formatMessage({ id: 'FARMING_TABLE_YOUR_REWARD' })}
                    </div>
                    <div className="list__cell list__cell--right">
                        {intl.formatMessage({ id: 'FARMING_TABLE_ENTITLED_REWARD' })}
                    </div>
                </div>

                {loading && items.length === 0 ? (
                    <div className="farming-table__message">
                        <ContentLoader slim />
                    </div>
                ) : (
                    <>
                        {!loading && items.length === 0 ? (
                            <div className="farming-table__message">
                                {intl.formatMessage({ id: 'FARMING_TABLE_NOT_FOUND' })}
                            </div>
                        ) : (
                            <PanelLoader loading={loading && items.length > 0}>
                                {items.map((item, index) => (
                                    /* eslint-disable react/no-array-index-key */
                                    <FarmingTableItem key={index} {...item} />
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
    )
}
