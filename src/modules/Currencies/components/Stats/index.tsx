import * as React from 'react'
import classNames from 'classnames'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { TvlChange } from '@/components/common/TvlChange'
import { Chart } from '@/modules/Chart'
import { useCurrencyStore } from '@/modules/Currencies/providers/CurrencyStoreProvider'
import { CurrencyStoreState } from '@/modules/Currencies/types'
import { getChangesDirection } from '@/utils'

import './index.scss'


/* eslint-disable jsx-a11y/anchor-is-valid */
export function Stats(): JSX.Element {
    const intl = useIntl()
    const store = useCurrencyStore()

    const toggleGraph = (graph: CurrencyStoreState['graph']) => () => {
        store.changeState('graph', graph)
    }

    const toggleTimeframe = (value: CurrencyStoreState['timeframe']) => () => {
        store.changeState('timeframe', value)
    }

    return (
        <div className="currency-stats">
            <div className="currency-stats__sidebar">
                <div className="currency-stats__sidebar-item">
                    <div className="currency-stats__stat-term">
                        {intl.formatMessage({
                            id: 'CURRENCY_STATS_TVL_TERM',
                        })}
                    </div>
                    <div className="currency-stats__stat-value">
                        <strong>{store.formattedTvl}</strong>
                    </div>
                    {store.currency?.tvlChange !== undefined && (
                        <TvlChange
                            changesDirection={getChangesDirection(store.currency.tvlChange)}
                            priceChange={store.currency.tvlChange}
                        />
                    )}
                </div>
                <div className="currency-stats__sidebar-item">
                    <div className="currency-stats__stat-term">
                        {intl.formatMessage({
                            id: 'CURRENCY_STATS_VOLUME24_TERM',
                        })}
                    </div>
                    <div className="currency-stats__stat-value">
                        <strong>{store.formattedVolume24h}</strong>
                    </div>
                    {store.currency?.volumeChange24h !== undefined && (
                        <TvlChange
                            changesDirection={getChangesDirection(store.currency.volumeChange24h)}
                            priceChange={store.currency.volumeChange24h}
                        />
                    )}
                </div>
                <div className="currency-stats__sidebar-item">
                    <div className="currency-stats__stat-term">
                        {intl.formatMessage({
                            id: 'CURRENCY_STATS_VOLUME7_TERM',
                        })}
                    </div>
                    <div className="currency-stats__stat-value">
                        <strong>{store.formattedVolume7d}</strong>
                    </div>
                </div>
                <div className="currency-stats__sidebar-item">
                    <div className="currency-stats__stat-term">
                        {intl.formatMessage({
                            id: 'CURRENCY_STATS_TRANSACTIONS24_TERM',
                        })}
                    </div>
                    <div className="currency-stats__stat-value">
                        <strong>
                            {store.currency?.transactionsCount24h}
                        </strong>
                    </div>
                </div>
            </div>
            <div className="currency-stats__chart">
                <header className="currency-stats__chart-actions">
                    <Observer>
                        {() => (
                            <>
                                <ul className="tabs">
                                    <li
                                        className={classNames({
                                            active: store.timeframe === 'D1',
                                        })}
                                    >
                                        <a onClick={toggleTimeframe('D1')}>
                                            D
                                        </a>
                                    </li>
                                    <li
                                        className={classNames({
                                            active: store.timeframe === 'H1',
                                        })}
                                    >
                                        <a onClick={toggleTimeframe('H1')}>H</a>
                                    </li>
                                </ul>

                                <ul className="tabs">
                                    <li
                                        className={classNames({
                                            active: store.graph === 'prices',
                                        })}
                                    >
                                        <a onClick={toggleGraph('prices')}>
                                            {intl.formatMessage({
                                                id: 'CURRENCY_GRAPH_TAB_PRICES',
                                            })}
                                        </a>
                                    </li>
                                    <li
                                        className={classNames({
                                            active: store.graph === 'volume',
                                        })}
                                    >
                                        <a onClick={toggleGraph('volume')}>
                                            {intl.formatMessage({
                                                id: 'CURRENCY_GRAPH_TAB_VOLUME',
                                            })}
                                        </a>
                                    </li>
                                    <li
                                        className={classNames({
                                            active: store.graph === 'tvl',
                                        })}
                                    >
                                        <a onClick={toggleGraph('tvl')}>
                                            {intl.formatMessage({
                                                id: 'CURRENCY_GRAPH_TAB_TVL',
                                            })}
                                        </a>
                                    </li>
                                </ul>
                            </>
                        )}
                    </Observer>
                </header>

                <Observer>
                    {() => (
                        <div className="currency-stats__chart-wrapper">
                            {store.graph === 'prices' && (
                                <Chart
                                    key="pricesGraph"
                                    data={store.pricesGraphData}
                                    timeframe={store.timeframe}
                                    type="Candlestick"
                                    load={store.loadPricesGraph}
                                />
                            )}

                            {store.graph === 'tvl' && (
                                <Chart
                                    key="tvlGraph"
                                    data={store.tvlGraphData}
                                    timeframe={store.timeframe}
                                    type="Area"
                                    load={store.loadTvlGraph}
                                />
                            )}

                            {store.graph === 'volume' && (
                                <Chart
                                    key="volumeGraph"
                                    data={store.volumeGraphData}
                                    timeframe={store.timeframe}
                                    type="Histogram"
                                    load={store.loadVolumeGraph}
                                />
                            )}
                        </div>
                    )}
                </Observer>
            </div>
        </div>
    )
}
