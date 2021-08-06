import * as React from 'react'
import classNames from 'classnames'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { UserAvatar } from '@/components/common/UserAvatar'
import { Chart } from '@/modules/Chart'
import { usePairStore } from '@/modules/Pairs/providers/PairStoreProvider'
import { PairStoreState } from '@/modules/Pairs/types'
import { useTokensCache } from '@/stores/TokensCacheService'
import { formatBalance, getChangesDirection } from '@/utils'

import './index.scss'


/* eslint-disable jsx-a11y/anchor-is-valid */
export function Stats(): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const store = usePairStore()

    const baseToken = React.useMemo(() => (
        store.pair?.meta.baseAddress
            ? tokensCache.get(store.pair.meta.baseAddress)
            : undefined
    ), [store.pair?.meta.baseAddress, tokensCache.tokens])

    const counterToken = React.useMemo(() => (
        store.pair?.meta.counterAddress
            ? tokensCache.get(store.pair.meta.counterAddress)
            : undefined
    ), [store.pair?.meta.counterAddress, tokensCache.tokens])

    const leftLocked = React.useMemo(
        () => formatBalance(
            store.pair?.leftLocked || '0',
            baseToken?.decimals || 0,
        ),
        [baseToken, store.pair?.leftLocked],
    )

    const rightLocked = React.useMemo(
        () => formatBalance(
            store.pair?.rightLocked || '0',
            counterToken?.decimals || 0,
        ),
        [counterToken, store.pair?.rightLocked],
    )

    const toggleGraph = (graph: PairStoreState['graph']) => () => {
        store.changeState('graph', graph)
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
                                    {baseToken?.icon !== undefined ? (
                                        <img
                                            src={baseToken.icon}
                                            alt={baseToken.name}
                                            className="pair-stats__token-icon"
                                        />
                                    ) : baseToken?.root !== undefined && (
                                        <UserAvatar address={baseToken.root} small />
                                    )}
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
                                    {counterToken?.icon !== undefined ? (
                                        <img
                                            src={counterToken.icon}
                                            alt={counterToken.name}
                                            className="pair-stats__token-icon"
                                        />
                                    ) : counterToken?.root !== undefined && (
                                        <UserAvatar address={counterToken.root} small />
                                    )}
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
                        <div
                            className={classNames('changes-direction', {
                                'changes-direction-up': getChangesDirection(store.pair.tvlChange) > 0,
                                'changes-direction-down': getChangesDirection(store.pair.tvlChange) < 0,
                            })}
                        >
                            {store.pair.tvlChange}
                            %
                        </div>
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
                        <div
                            className={classNames('changes-direction', {
                                'changes-direction-up': getChangesDirection(store.pair.volumeChange24h) > 0,
                                'changes-direction-down': getChangesDirection(store.pair.volumeChange24h) < 0,
                            })}
                        >
                            {store.pair.volumeChange24h}
                            %
                        </div>
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
                            <ul className="tabs">
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
                                    timeframe={store.timeframe}
                                    type="Histogram"
                                    load={store.loadGraph}
                                />
                            )}

                            {store.graph === 'tvl' && (
                                <Chart
                                    key="tvlGraph"
                                    data={store.tvlGraphData}
                                    timeframe={store.timeframe}
                                    type="Area"
                                    load={store.loadGraph}
                                />
                            )}
                        </div>
                    )}
                </Observer>
            </div>
        </div>
    )
}
