import * as React from 'react'
import classNames from 'classnames'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { NativeScrollArea } from '@/components/common/NativeScrollArea'
import { TokenIcon } from '@/components/common/TokenIcon'
import { RateChange } from '@/components/common/RateChange'
import { Chart } from '@/modules/Chart'
import { usePairStore } from '@/modules/Pairs/providers/PairStoreProvider'
import { PairStoreState } from '@/modules/Pairs/types'
import { TokenCache } from '@/stores/TokensCacheService'
import { formattedTokenAmount } from '@/utils'

import './index.scss'


type Props = {
    baseToken?: TokenCache;
    counterToken?: TokenCache;
}


/* eslint-disable jsx-a11y/anchor-is-valid */
export function Stats({ baseToken, counterToken }: Props): JSX.Element {
    const intl = useIntl()
    const store = usePairStore()

    const leftLocked = React.useMemo(
        () => formattedTokenAmount(
            store.pair?.leftLocked ?? 0,
            baseToken?.decimals,
        ),
        [baseToken, store.pair?.leftLocked],
    )

    const rightLocked = React.useMemo(
        () => formattedTokenAmount(
            store.pair?.rightLocked ?? 0,
            counterToken?.decimals,
        ),
        [counterToken, store.pair?.rightLocked],
    )

    const toggleGraph = (value: PairStoreState['graph']) => () => {
        store.changeState('graph', value)
    }

    const toggleTimeframe = (value: PairStoreState['timeframe']) => () => {
        store.changeState('timeframe', value)
    }

    return (
        <div className="pair-stats">
            <div className="pair-stats__sidebar">
                <div className="pair-stats__sidebar-item">
                    <div className="pair-stats__stat-term">
                        {intl.formatMessage({
                            id: 'PAIR_STATS_TTL_TERM',
                        })}
                    </div>
                    <div className="pair-stats__stat-value">
                        <div className="pair-stats__ttl">
                            <div>
                                <div className="pair-stats__token">
                                    <TokenIcon
                                        address={baseToken?.root || store.pair?.meta.baseAddress}
                                        className="pair-stats__token-icon"
                                        name={baseToken?.symbol || store.pair?.meta.base}
                                        size="small"
                                        icon={baseToken?.icon}
                                    />
                                    <div className="pair-stats__token-name">
                                        {baseToken?.symbol || store.pair?.meta.base}
                                    </div>
                                </div>
                                <div className="pair-stats__token-locked-value">
                                    {leftLocked}
                                </div>
                            </div>
                            <div>
                                <div className="pair-stats__token">
                                    <TokenIcon
                                        address={counterToken?.root || store.pair?.meta.counterAddress}
                                        className="pair-stats__token-icon"
                                        name={counterToken?.symbol || store.pair?.meta.counter}
                                        size="small"
                                        icon={counterToken?.icon}
                                    />
                                    <div className="pair-stats__token-name">
                                        {counterToken?.symbol || store.pair?.meta.counter}
                                    </div>
                                </div>
                                <div className="pair-stats__token-locked-value">
                                    {rightLocked}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="pair-stats__sidebar-item">
                    <div className="pair-stats__stat-term">
                        {intl.formatMessage({
                            id: 'PAIR_STATS_TVL_TERM',
                        })}
                    </div>
                    <div className="pair-stats__stat-value">
                        <strong>{store.formattedTvl}</strong>
                    </div>
                    {store.pair?.tvlChange !== undefined && (
                        <RateChange value={store.pair.tvlChange} />
                    )}
                </div>
                <div className="pair-stats__sidebar-item">
                    <div className="pair-stats__stat-term">
                        {intl.formatMessage({
                            id: 'PAIR_STATS_VOLUME24_TERM',
                        })}
                    </div>
                    <div className="pair-stats__stat-value">
                        <strong>{store.formattedVolume24h}</strong>
                    </div>
                    {store.pair?.volumeChange24h !== undefined && (
                        <RateChange value={store.pair.volumeChange24h} />
                    )}
                </div>
                <div className="pair-stats__sidebar-item">
                    <div className="pair-stats__stat-term">
                        {intl.formatMessage({
                            id: 'PAIR_STATS_FEES24_TERM',
                        })}
                    </div>
                    <div className="pair-stats__stat-value">
                        <strong>{store.formattedFees24h}</strong>
                    </div>
                </div>
            </div>
            <div className="pair-stats__chart">
                <header className="pair-stats__chart-actions">
                    <Observer>
                        {() => (
                            <NativeScrollArea>
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
                                            active: store.graph === 'ohlcv',
                                        })}
                                    >
                                        <a onClick={toggleGraph('ohlcv')}>
                                            {baseToken?.symbol || store.pair?.meta.base}
                                            /
                                            {counterToken?.symbol || store.pair?.meta.counter}
                                        </a>
                                    </li>
                                    <li
                                        className={classNames({
                                            active: store.graph === 'ohlcv-inverse',
                                        })}
                                    >
                                        <a onClick={toggleGraph('ohlcv-inverse')}>
                                            {counterToken?.symbol || store.pair?.meta.counter}
                                            /
                                            {baseToken?.symbol || store.pair?.meta.base}
                                        </a>
                                    </li>
                                    <li
                                        className={classNames({
                                            active: store.graph === 'volume',
                                        })}
                                    >
                                        <a onClick={toggleGraph('volume')}>
                                            {intl.formatMessage({
                                                id: 'PAIR_GRAPH_TAB_VOLUME',
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
                                                id: 'PAIR_GRAPH_TAB_TVL',
                                            })}
                                        </a>
                                    </li>
                                </ul>
                            </NativeScrollArea>
                        )}
                    </Observer>
                </header>

                <Observer>
                    {() => (
                        <div className="pair-stats__chart-wrapper">
                            {store.graph === 'volume' && (
                                <Chart
                                    key="volumeGraph"
                                    data={store.volumeGraphData}
                                    load={store.loadVolumeGraph}
                                    loading={store.isVolumeGraphLoading}
                                    noDataMessage={intl.formatMessage({
                                        id: 'CHART_NO_DATA',
                                    })}
                                    timeframe={store.timeframe}
                                    type="Histogram"
                                />
                            )}

                            {store.graph === 'tvl' && (
                                <Chart
                                    key="tvlGraph"
                                    data={store.tvlGraphData}
                                    load={store.loadTvlGraph}
                                    loading={store.isTvlGraphLoading}
                                    noDataMessage={intl.formatMessage({
                                        id: 'CHART_NO_DATA',
                                    })}
                                    timeframe={store.timeframe}
                                    type="Area"
                                />
                            )}

                            {store.graph === 'ohlcv' && (
                                <Chart
                                    key="ohlcvGraph"
                                    data={store.ohlcvGraphData}
                                    load={store.loadOhlcvGraph}
                                    loading={store.isOhlcvGraphLoading}
                                    noDataMessage={intl.formatMessage({
                                        id: 'CHART_NO_DATA',
                                    })}
                                    timeframe={store.timeframe}
                                    type="Candlestick"
                                />
                            )}

                            {store.graph === 'ohlcv-inverse' && (
                                <Chart
                                    key="ohlcvInverseGraph"
                                    data={store.ohlcvGraphInverseData}
                                    load={store.loadOhlcvGraph}
                                    loading={store.isOhlcvGraphLoading}
                                    noDataMessage={intl.formatMessage({
                                        id: 'CHART_NO_DATA',
                                    })}
                                    options={{
                                        localization: {
                                            priceFormatter: (value: number) => (1 / value).toFixed(2),
                                        },
                                        rightPriceScale: {
                                            invertScale: true,
                                        },
                                    }}
                                    timeframe={store.timeframe}
                                    type="Candlestick"
                                />
                            )}
                        </div>
                    )}
                </Observer>
            </div>
        </div>
    )
}
