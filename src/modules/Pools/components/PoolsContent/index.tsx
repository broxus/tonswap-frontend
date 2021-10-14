import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { FormattedMessage, useIntl } from 'react-intl'
import { Link } from 'react-router-dom'

import { usePoolsContent } from '@/modules/Pools/hooks/usePoolsContent'
import { Pagination } from '@/components/common/Pagination'
import { ContentLoader } from '@/components/common/ContentLoader'
import { PanelLoader } from '@/components/common/PanelLoader'

import { Item } from './item'

import './style.scss'


export const PoolsContent = observer((): JSX.Element => {
    const intl = useIntl()
    const {
        loading,
        totalPages,
        items,
        query,
        currentPage,
        onSubmit,
        onNext,
        onPrev,
    } = usePoolsContent()

    return (
        <>
            <div className="card card--small card--flat">
                <div className="list polls-list">
                    <div className="list__header">
                        <div className="list__cell list__cell--left">
                            {intl.formatMessage({ id: 'POOLS_LIST_TABLE_PAIR' })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({ id: 'POOLS_LIST_TABLE_LP_TOKENS' })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({ id: 'POOLS_LIST_TABLE_LEFT_TOKEN' })}
                        </div>
                        <div className="list__cell list__cell--right">
                            {intl.formatMessage({ id: 'POOLS_LIST_TABLE_RIGHT_TOKEN' })}
                        </div>
                    </div>

                    {!loading && items.length === 0 ? (
                        <div className="message">
                            {query ? (
                                <p>{intl.formatMessage({ id: 'POOLS_LIST_NOTHING_FOUND' })}</p>
                            ) : (
                                <>
                                    <p>{intl.formatMessage({ id: 'POOLS_LIST_EMPTY_TABLE' })}</p>
                                    <p className="message_faded__text small">
                                        <FormattedMessage
                                            id="POOLS_LIST_EMPTY_TABLE_META"
                                            values={{
                                                link: (
                                                    <Link to="/pairs">
                                                        {intl.formatMessage({
                                                            id: 'POOLS_LIST_EMPTY_TABLE_META_LINK_TEXT',
                                                        })}
                                                    </Link>
                                                ),
                                            }}
                                        />
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {loading && items.length === 0 ? (
                                <ContentLoader />
                            ) : (
                                <PanelLoader loading={loading && items.length > 0}>
                                    {items.map(item => (
                                        <Item key={item.pair.pairLabel} {...item} />
                                    ))}
                                </PanelLoader>
                            )}
                        </>
                    )}
                </div>

                {totalPages > 1 && (
                    <Pagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onNext={onNext}
                        onPrev={onPrev}
                        onSubmit={onSubmit}
                    />
                )}
            </div>
        </>
    )
})
